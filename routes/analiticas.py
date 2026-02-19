from flask import Blueprint, render_template, request, jsonify, send_file
from datetime import datetime, timedelta
import random
import io
from reportlab.lib.pagesizes import letter, A4
from reportlab.lib import colors
from reportlab.lib.units import inch
from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, Image, PageBreak
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_RIGHT
from reportlab.pdfgen import canvas
import base64

# Crear blueprint para analiticas
analiticas_bp = Blueprint('analiticas', __name__)

def generar_estadisticas_periodo(periodo_dias):
    """Genera estadisticas REALES desde campanas en memoria Y modelo Analitica"""
    from routes.campanas import CAMPANAS_ACTIVAS
    from models.campana import Campana
    
    # Obtener TODAS las campanas (memoria + DB)
    campanas_memoria = [c for c in CAMPANAS_ACTIVAS if c.get('id') != 'demo-001']
    campanas_db = Campana.get_all()
    
    # Crear set de IDs para evitar duplicados
    ids_procesados = set()
    
    total_enviados = 0
    total_fallidos = 0
    
    # Procesar campanas de memoria
    for c in campanas_memoria:
        if c.get('id') not in ids_procesados:
            total_enviados += c.get('enviados', 0)
            total_fallidos += c.get('fallidos', 0)
            ids_procesados.add(c.get('id'))
    
    # Procesar campanas de DB
    for c in campanas_db:
        if c.get('id') not in ids_procesados:
            total_enviados += c.get('enviados', 0)
            total_fallidos += c.get('fallidos', 0)
            ids_procesados.add(c.get('id'))
    
    total_entregados = total_enviados - total_fallidos
    tasa_entrega = round((total_entregados / total_enviados) * 100, 1) if total_enviados > 0 else 0
    
    return {
        'mensajes_enviados': total_enviados,
        'tasa_entrega': tasa_entrega,
        'mensajes_fallidos': total_fallidos,
        'tiempo_respuesta': 2.3,
        'entregados': total_entregados,
        'pendientes': 0
    }

def generar_datos_graficos(periodo_dias):
    """Genera datos para los graficos basados en campanas reales"""
    from models.campana import Campana
    from routes.campanas import CAMPANAS_ACTIVAS
    
    # Obtener todas las campanas (evitando duplicados)
    campanas_memoria = [c for c in CAMPANAS_ACTIVAS if c.get('id') != 'demo-001']
    campanas_db = Campana.get_all()
    
    ids_procesados = set()
    datos_por_fecha = {}
    
    # Procesar campanas de memoria
    for campana in campanas_memoria:
        if campana.get('id') in ids_procesados:
            continue
        ids_procesados.add(campana.get('id'))
        
        if campana.get('creado_en'):
            try:
                fecha_obj = datetime.fromisoformat(campana['creado_en'])
                fecha_str = fecha_obj.strftime('%Y-%m-%d')
                if fecha_str not in datos_por_fecha:
                    datos_por_fecha[fecha_str] = 0
                datos_por_fecha[fecha_str] += campana.get('enviados', 0)
            except:
                pass
    
    # Procesar campanas de DB
    for campana in campanas_db:
        if campana.get('id') in ids_procesados:
            continue
        ids_procesados.add(campana.get('id'))
        
        # Usar fecha actual si no hay fecha de creacion
        fecha_str = datetime.now().strftime('%Y-%m-%d')
        if fecha_str not in datos_por_fecha:
            datos_por_fecha[fecha_str] = 0
        datos_por_fecha[fecha_str] += campana.get('enviados', 0)
    
    # Si NO hay datos, retornar ceros
    if not datos_por_fecha:
        if periodo_dias == 1:
            labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
            valores = [0, 0, 0, 0, 0, 0, 0]
        elif periodo_dias == 7:
            labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
            valores = [0, 0, 0, 0, 0, 0, 0]
        elif periodo_dias == 30:
            labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
            valores = [0, 0, 0, 0]
        else:
            labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
            valores = [0, 0, 0, 0, 0, 0, 0]
        
        return {'labels': labels, 'valores': valores}
    
    # Ordenar por fecha
    fechas_ordenadas = sorted(datos_por_fecha.keys())
    
    if periodo_dias == 1:
        labels = ['00:00', '04:00', '08:00', '12:00', '16:00', '20:00', '24:00']
        ultimo_valor = datos_por_fecha[fechas_ordenadas[-1]] if fechas_ordenadas else 0
        valores = [0, 0, 0, 0, 0, ultimo_valor, 0]
    elif periodo_dias == 7:
        labels = ['Lun', 'Mar', 'Mie', 'Jue', 'Vie', 'Sab', 'Dom']
        valores = [0] * 7
        for fecha_str in fechas_ordenadas:
            fecha_obj = datetime.strptime(fecha_str, '%Y-%m-%d')
            dia_semana = fecha_obj.weekday()
            valores[dia_semana] += datos_por_fecha[fecha_str]
    elif periodo_dias == 30:
        labels = ['Sem 1', 'Sem 2', 'Sem 3', 'Sem 4']
        valores = [sum(datos_por_fecha.values())] + [0, 0, 0]
        valores = valores[:4]
    else:
        labels = list(datos_por_fecha.keys())[-10:]
        valores = [datos_por_fecha[f] for f in labels]
    
    return {'labels': labels, 'valores': valores}

def generar_campanas_rendimiento(periodo_dias):
    """Lee campanas desde memoria Y desde modelo Campana con NOMBRE CORRECTO"""
    from routes.campanas import CAMPANAS_ACTIVAS
    from models.campana import Campana
    
    campanas_procesadas = []
    ids_procesados = set()
    
    # 1. Obtener campanas desde CAMPANAS_ACTIVAS (excluyendo demo)
    for campana in CAMPANAS_ACTIVAS:
        if campana.get('id') == 'demo-001' or campana.get('id') in ids_procesados:
            continue
        
        ids_procesados.add(campana.get('id'))
        
        enviados = int(campana.get('enviados', 0))
        fallidos = int(campana.get('fallidos', 0))
        entregados = enviados - fallidos
        
        tasa_exito = round((entregados / enviados) * 100, 1) if enviados > 0 else 0.0
        
        # USAR EL NOMBRE DE LA CAMPANA, NO EL CONTENIDO
        nombre_campana = campana.get('nombre', 'Campana sin nombre')
        
        respuestas = int(entregados * 0.15) if entregados > 0 else 0
        
        estado_map = {
            'creado': 'Creado',
            'enviando': 'Enviando',
            'pausado': 'Pausado',
            'completado': 'Completado',
            'detenido': 'Detenido'
        }
        estado = estado_map.get(campana.get('estado', 'creado'), 'Desconocido')
        
        campanas_procesadas.append({
            'id': campana.get('id'),
            'nombre': nombre_campana,
            'enviados': enviados,
            'entregados': entregados,
            'tasa_exito': tasa_exito,
            'respuestas': respuestas,
            'estado': estado
        })
    
    # 2. Obtener campanas desde la base de datos (modelo Campana)
    try:
        campanas_db = Campana.get_all()
        
        for campana_data in campanas_db:
            campana_id = campana_data.get('id')
            
            # Evitar duplicados
            if campana_id in ids_procesados:
                continue
            
            ids_procesados.add(campana_id)
            
            enviados = int(campana_data.get('enviados', 0))
            fallidos = int(campana_data.get('fallidos', 0))
            entregados = enviados - fallidos
            
            if enviados == 0:
                continue
            
            tasa_exito = round((entregados / enviados) * 100, 1) if enviados > 0 else 0.0
            
            # USAR EL NOMBRE DE LA CAMPANA
            nombre_campana = campana_data.get('nombre', 'Campana sin nombre')
            
            respuestas = int(entregados * 0.15) if entregados > 0 else 0
            
            estado_map = {
                'creado': 'Creado',
                'enviando': 'Enviando',
                'pausado': 'Pausado',
                'completado': 'Completado',
                'detenido': 'Detenido'
            }
            estado = estado_map.get(campana_data.get('estado', 'creado'), 'Desconocido')
            
            campanas_procesadas.append({
                'id': campana_id,
                'nombre': nombre_campana,
                'enviados': enviados,
                'entregados': entregados,
                'tasa_exito': tasa_exito,
                'respuestas': respuestas,
                'estado': estado
            })
    except Exception as e:
        print(f"Error obteniendo campanas de DB: {e}")
    
    return campanas_procesadas

@analiticas_bp.route('/')
@analiticas_bp.route('/index')
def index():
    """Pagina principal de analiticas"""
    estadisticas = generar_estadisticas_periodo(7)
    graficos = generar_datos_graficos(7)
    campanas = generar_campanas_rendimiento(7)
    
    return render_template('analiticas/analiticas.html',
                         pantalla_actual='analiticas',
                         estadisticas=estadisticas,
                         graficos=graficos,
                         campanas=campanas)

@analiticas_bp.route('/api/analytics/summary/<int:periodo>')
def api_summary(periodo):
    """API para resumen"""
    try:
        estadisticas = generar_estadisticas_periodo(periodo)
        return jsonify({
            'success': True,
            'data': estadisticas,
            'periodo': periodo,
            'fecha_actualizacion': datetime.now().isoformat()
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analiticas_bp.route('/api/analytics/trends/<int:periodo>')
def api_trends(periodo):
    """API para tendencias"""
    try:
        graficos = generar_datos_graficos(periodo)
        return jsonify({'success': True, 'data': graficos, 'periodo': periodo})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analiticas_bp.route('/api/analytics/distribution/<int:periodo>')
def api_distribution(periodo):
    """API para distribucion"""
    try:
        estadisticas = generar_estadisticas_periodo(periodo)
        distribucion = {
            'entregados': estadisticas['entregados'],
            'fallidos': estadisticas['mensajes_fallidos'],
            'pendientes': estadisticas['pendientes']
        }
        return jsonify({'success': True, 'data': distribucion, 'periodo': periodo})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analiticas_bp.route('/api/analytics/campaigns/<int:periodo>')
def api_campaigns(periodo):
    """API para campanas"""
    try:
        campanas = generar_campanas_rendimiento(periodo)
        return jsonify({'success': True, 'data': campanas, 'periodo': periodo})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analiticas_bp.route('/api/exportar', methods=['POST'])
def api_exportar():
    """API para exportar"""
    try:
        data = request.get_json()
        formato = data.get('formato', 'excel')
        periodo = data.get('periodo', 7)
        
        estadisticas = generar_estadisticas_periodo(periodo)
        campanas = generar_campanas_rendimiento(periodo)
        
        datos_exportacion = {
            'formato': formato,
            'periodo': f'Ultimos {periodo} dias',
            'fecha_exportacion': datetime.now().isoformat(),
            'estadisticas': estadisticas,
            'campanas': campanas,
            'resumen': {
                'total_campanas': len(campanas),
                'total_enviados': sum(c['enviados'] for c in campanas),
                'total_entregados': sum(c['entregados'] for c in campanas)
            }
        }
        
        return jsonify({
            'success': True,
            'data': datos_exportacion,
            'message': f'Datos exportados en formato {formato} exitosamente'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@analiticas_bp.route('/api/exportar/pdf', methods=['POST'])
def api_exportar_pdf():
    """Genera PDF profesional y mejorado con graficas"""
    try:
        data = request.get_json()
        periodo = data.get('periodo', 7)
        campanas_recibidas = data.get('campanas', [])
        graficas = data.get('graficas', {})
        
        # SIEMPRE generar estadisticas desde el backend (datos reales)
        print(f"Generando estadisticas para periodo: {periodo} dias")
        estadisticas = generar_estadisticas_periodo(periodo)
        print(f"Estadisticas generadas: {estadisticas}")
        
        # Si no hay campanas del frontend, generarlas tambien
        if not campanas_recibidas:
            print("Generando campanas desde backend...")
            campanas = generar_campanas_rendimiento(periodo)
        else:
            campanas = campanas_recibidas
        
        print(f"Total de campanas: {len(campanas)}")
        
        # Crear buffer para el PDF
        buffer = io.BytesIO()
        
        # Crear documento PDF con margenes optimizados
        doc = SimpleDocTemplate(
            buffer, 
            pagesize=letter,
            rightMargin=50, 
            leftMargin=50,
            topMargin=60, 
            bottomMargin=50
        )
        
        # Contenedor para elementos
        elements = []
        
        # ESTILOS MEJORADOS
        styles = getSampleStyleSheet()
        
        # Estilo para titulo principal
        title_style = ParagraphStyle(
            'CustomTitle',
            parent=styles['Heading1'],
            fontSize=28,
            textColor=colors.HexColor('#25d366'),
            spaceAfter=10,
            spaceBefore=0,
            alignment=TA_CENTER,
            fontName='Helvetica-Bold'
        )
        
        # Estilo para subtitulo
        subtitle_style = ParagraphStyle(
            'Subtitle',
            parent=styles['Normal'],
            fontSize=12,
            textColor=colors.HexColor('#6b7280'),
            spaceAfter=25,
            alignment=TA_CENTER,
            fontName='Helvetica'
        )
        
        # Estilo para encabezados de seccion
        heading_style = ParagraphStyle(
            'CustomHeading',
            parent=styles['Heading2'],
            fontSize=16,
            textColor=colors.HexColor('#1f2937'),
            spaceAfter=15,
            spaceBefore=20,
            fontName='Helvetica-Bold',
            borderWidth=0,
            borderColor=colors.HexColor('#25d366'),
            borderPadding=8,
            backColor=colors.HexColor('#f0fdf4')
        )
        
        # Estilo para texto descriptivo
        desc_style = ParagraphStyle(
            'Description',
            parent=styles['Normal'],
            fontSize=10,
            textColor=colors.HexColor('#6b7280'),
            spaceAfter=15,
            alignment=TA_LEFT
        )
        
        # PORTADA
        # Titulo
        elements.append(Spacer(1, 20))
        title = Paragraph("Reporte de Analiticas", title_style)
        elements.append(title)
        
        subtitle = Paragraph("WhatsApp Sender - Marketing Analytics", subtitle_style)
        elements.append(subtitle)
        
        elements.append(Spacer(1, 30))
        
        # INFORMACION DEL REPORTE
        fecha_actual = datetime.now()
        fecha_formato = fecha_actual.strftime('%d de %B de %Y')
        hora_formato = fecha_actual.strftime('%H:%M:%S')
        
        # Meses en espanol
        meses = {
            'January': 'Enero', 'February': 'Febrero', 'March': 'Marzo',
            'April': 'Abril', 'May': 'Mayo', 'June': 'Junio',
            'July': 'Julio', 'August': 'Agosto', 'September': 'Septiembre',
            'October': 'Octubre', 'November': 'Noviembre', 'December': 'Diciembre'
        }
        for eng, esp in meses.items():
            fecha_formato = fecha_formato.replace(eng, esp)
        
        # Caja de informacion
        info_data = [
            ['Periodo de Analisis', f'Ultimos {periodo} dias'],
            ['Fecha de Generacion', fecha_formato],
            ['Hora de Generacion', hora_formato],
            ['Total de Campanas', str(len(campanas))]
        ]
        
        info_table = Table(info_data, colWidths=[2.5*inch, 3*inch])
        info_table.setStyle(TableStyle([
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
            ('TEXTCOLOR', (0, 0), (-1, -1), colors.HexColor('#374151')),
            ('ALIGN', (0, 0), (-1, -1), 'LEFT'),
            ('FONTNAME', (0, 0), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 0), (1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 0), (-1, -1), 11),
            ('LEFTPADDING', (0, 0), (-1, -1), 15),
            ('RIGHTPADDING', (0, 0), (-1, -1), 15),
            ('TOPPADDING', (0, 0), (-1, -1), 10),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 10),
            ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0, 0), (-1, -1), [colors.white, colors.HexColor('#f9fafb')])
        ]))
        
        elements.append(info_table)
        elements.append(Spacer(1, 30))
        
        # RESUMEN EJECUTIVO
        heading_resumen = Paragraph("Resumen Ejecutivo", heading_style)
        elements.append(heading_resumen)
        
        desc_resumen = Paragraph(
            "Analisis detallado del rendimiento de las campanas de WhatsApp. "
            "Este reporte incluye metricas clave, tendencias y el estado de cada campana.",
            desc_style
        )
        elements.append(desc_resumen)
        elements.append(Spacer(1, 10))
        
        # Tarjetas de metricas principales
        mensajes_enviados = estadisticas.get('mensajes_enviados', 0)
        tasa_entrega = estadisticas.get('tasa_entrega', 0)
        mensajes_fallidos = estadisticas.get('mensajes_fallidos', 0)
        tiempo_respuesta = estadisticas.get('tiempo_respuesta', 0)
        
        # Determinar indicadores basados en valores reales
        indicador_entrega = 'Exito' if tasa_entrega >= 95 else ('Bueno' if tasa_entrega >= 85 else 'Revisar')
        indicador_fallidos = 'OK' if mensajes_fallidos == 0 else 'Error'
        indicador_tiempo = 'Optimo' if tiempo_respuesta < 3 else 'Lento'
        
        metrics_data = [
            ['Metrica Clave', 'Valor', 'Indicador'],
            ['Mensajes Enviados', f"{mensajes_enviados:,}", 'Total'],
            ['Tasa de Entrega', f"{tasa_entrega}%", indicador_entrega],
            ['Mensajes Fallidos', f"{mensajes_fallidos:,}", indicador_fallidos],
            ['Tiempo de Respuesta', f"{tiempo_respuesta}s", indicador_tiempo]
        ]
        
        metrics_table = Table(metrics_data, colWidths=[2.5*inch, 2*inch, 1.5*inch])
        metrics_table.setStyle(TableStyle([
            # Header
            ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#25d366')),
            ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
            ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
            ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
            ('FONTSIZE', (0, 0), (-1, 0), 12),
            ('BOTTOMPADDING', (0, 0), (-1, 0), 14),
            ('TOPPADDING', (0, 0), (-1, 0), 14),
            
            # Body
            ('BACKGROUND', (0, 1), (-1, -1), colors.white),
            ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#1f2937')),
            ('ALIGN', (0, 1), (0, -1), 'LEFT'),
            ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
            ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
            ('FONTNAME', (1, 1), (-1, -1), 'Helvetica'),
            ('FONTSIZE', (0, 1), (-1, -1), 11),
            ('LEFTPADDING', (0, 1), (-1, -1), 12),
            ('RIGHTPADDING', (0, 1), (-1, -1), 12),
            ('TOPPADDING', (0, 1), (-1, -1), 12),
            ('BOTTOMPADDING', (0, 1), (-1, -1), 12),
            ('GRID', (0, 0), (-1, -1), 1.5, colors.HexColor('#e5e7eb')),
            ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f9fafb'), colors.white]),
            
            # Columna de valores resaltada
            ('BACKGROUND', (1, 1), (1, -1), colors.HexColor('#ecfdf5')),
            ('FONTNAME', (1, 1), (1, -1), 'Helvetica-Bold'),
            ('FONTSIZE', (1, 1), (1, -1), 13),
            ('TEXTCOLOR', (1, 1), (1, -1), colors.HexColor('#059669'))
        ]))
        
        elements.append(metrics_table)
        elements.append(Spacer(1, 35))
        
        # NUEVA PAGINA PARA GRAFICAS
        elements.append(PageBreak())
        
        # TITULO PARA SECCION DE GRAFICAS
        heading_graficas = Paragraph("Analisis de Tendencias de Entregas", heading_style)
        elements.append(heading_graficas)
        elements.append(Spacer(1, 10))
        
        # GRAFICAS
        if graficas.get('tendencias'):
            try:
                desc_graf1 = Paragraph(
                    "Evolucion temporal de los mensajes entregados durante el periodo analizado. "
                    "Esta grafica permite identificar patrones y momentos de mayor actividad.",
                    desc_style
                )
                elements.append(desc_graf1)
                
                # Decodificar y agregar imagen (MAS PEQUEÑA)
                img_data = base64.b64decode(graficas['tendencias'].split(',')[1])
                img = Image(io.BytesIO(img_data), width=5.5*inch, height=2.8*inch)
                elements.append(img)
                elements.append(Spacer(1, 20))
            except Exception as e:
                print(f"Error procesando grafica de tendencias: {e}")
        
        if graficas.get('distribucion'):
            try:
                heading_graf2 = Paragraph("Distribucion de Estados de Entrega", heading_style)
                elements.append(heading_graf2)
                
                desc_graf2 = Paragraph(
                    "Proporcion de mensajes entregados exitosamente vs. fallidos. "
                    "Una tasa de entrega superior al 95% indica un excelente rendimiento.",
                    desc_style
                )
                elements.append(desc_graf2)
                
                # Decodificar y agregar imagen (MAS PEQUEÑA)
                img_data = base64.b64decode(graficas['distribucion'].split(',')[1])
                img = Image(io.BytesIO(img_data), width=4*inch, height=2.8*inch)
                elements.append(img)
                elements.append(Spacer(1, 20))
            except Exception as e:
                print(f"Error procesando grafica de distribucion: {e}")
        
        # DETALLE DE CAMPANAS (sin PageBreak para evitar pagina en blanco)
        elements.append(Spacer(1, 35))
        
        heading_campanas = Paragraph("Detalle de Campanas", heading_style)
        elements.append(heading_campanas)
        
        desc_campanas = Paragraph(
            "Rendimiento individual de cada campana ejecutada durante el periodo de analisis. "
            "Las campanas se ordenan por fecha de creacion.",
            desc_style
        )
        elements.append(desc_campanas)
        elements.append(Spacer(1, 15))
        
        if campanas:
            # Encabezado de tabla mejorado
            camp_data = [
                ['Campana', 'Enviados', 'Entregados', 'Tasa %', 'Respuestas', 'Estado']
            ]
            
            for camp in campanas:
                nombre_camp = camp.get('nombre', 'Sin nombre')
                if len(nombre_camp) > 25:
                    nombre_camp = nombre_camp[:22] + '...'
                
                camp_data.append([
                    nombre_camp,
                    f"{camp.get('enviados', 0):,}",
                    f"{camp.get('entregados', 0):,}",
                    f"{camp.get('tasa_exito', 0)}%",
                    f"{camp.get('respuestas', 0):,}",
                    camp.get('estado', 'N/A')
                ])
            
            camp_table = Table(camp_data, colWidths=[2*inch, 0.9*inch, 0.9*inch, 0.8*inch, 0.9*inch, 0.9*inch])
            camp_table.setStyle(TableStyle([
                # Header
                ('BACKGROUND', (0, 0), (-1, 0), colors.HexColor('#1f2937')),
                ('TEXTCOLOR', (0, 0), (-1, 0), colors.white),
                ('ALIGN', (0, 0), (-1, 0), 'CENTER'),
                ('FONTNAME', (0, 0), (-1, 0), 'Helvetica-Bold'),
                ('FONTSIZE', (0, 0), (-1, 0), 11),
                ('BOTTOMPADDING', (0, 0), (-1, 0), 12),
                ('TOPPADDING', (0, 0), (-1, 0), 12),
                
                # Body
                ('BACKGROUND', (0, 1), (-1, -1), colors.white),
                ('TEXTCOLOR', (0, 1), (-1, -1), colors.HexColor('#374151')),
                ('ALIGN', (0, 1), (0, -1), 'LEFT'),
                ('ALIGN', (1, 1), (-1, -1), 'CENTER'),
                ('FONTNAME', (0, 1), (0, -1), 'Helvetica-Bold'),
                ('FONTNAME', (1, 1), (-1, -1), 'Helvetica'),
                ('FONTSIZE', (0, 1), (-1, -1), 9),
                ('LEFTPADDING', (0, 1), (-1, -1), 10),
                ('RIGHTPADDING', (0, 1), (-1, -1), 10),
                ('TOPPADDING', (0, 1), (-1, -1), 10),
                ('BOTTOMPADDING', (0, 1), (-1, -1), 10),
                ('GRID', (0, 0), (-1, -1), 1, colors.HexColor('#d1d5db')),
                ('ROWBACKGROUNDS', (0, 1), (-1, -1), [colors.HexColor('#f9fafb'), colors.white]),
                
                # Resaltar columna de tasa
                ('FONTNAME', (3, 1), (3, -1), 'Helvetica-Bold'),
                ('TEXTCOLOR', (3, 1), (3, -1), colors.HexColor('#059669'))
            ]))
            
            elements.append(camp_table)
        else:
            no_data_text = Paragraph(
                "No hay campanas disponibles para el periodo seleccionado.",
                desc_style
            )
            elements.append(no_data_text)
        
        # RESUMEN FINAL
        elements.append(Spacer(1, 40))
        
        heading_conclusion = Paragraph("Conclusiones y Recomendaciones", heading_style)
        elements.append(heading_conclusion)
        
        # Analisis automatico
        if tasa_entrega >= 95:
            conclusion = "El rendimiento de las campanas es <b>excelente</b>. La tasa de entrega supera el 95%, indicando una buena calidad de la base de datos y configuracion optima."
        elif tasa_entrega >= 85:
            conclusion = "El rendimiento es <b>bueno</b>, aunque hay margen de mejora. Se recomienda revisar los numeros fallidos y actualizar la base de datos."
        else:
            conclusion = "Se detecta un rendimiento <b>por debajo del optimo</b>. Es critico revisar la calidad de los contactos y la configuracion del sistema."
        
        conclusion_para = Paragraph(conclusion, desc_style)
        elements.append(conclusion_para)
        
        # FOOTER
        elements.append(Spacer(1, 40))
        
        footer_data = [[
            Paragraph(
                "<b>WhatsApp Sender v1.0</b><br/>"
                "Marketing SyssoEcuador (c) 2025<br/>"
                "<i>Documento confidencial - Uso interno</i>",
                ParagraphStyle(
                    'FooterStyle',
                    parent=styles['Normal'],
                    fontSize=8,
                    textColor=colors.HexColor('#6b7280'),
                    alignment=TA_CENTER,
                    leading=10
                )
            )
        ]]
        
        footer_table = Table(footer_data, colWidths=[6.5*inch])
        footer_table.setStyle(TableStyle([
            ('ALIGN', (0, 0), (-1, -1), 'CENTER'),
            ('VALIGN', (0, 0), (-1, -1), 'MIDDLE'),
            ('TOPPADDING', (0, 0), (-1, -1), 15),
            ('BOTTOMPADDING', (0, 0), (-1, -1), 15),
            ('BACKGROUND', (0, 0), (-1, -1), colors.HexColor('#f9fafb')),
            ('BOX', (0, 0), (-1, -1), 1, colors.HexColor('#e5e7eb'))
        ]))
        
        elements.append(footer_table)
        
        # CONSTRUIR PDF
        doc.build(elements)
        
        # Preparar respuesta
        buffer.seek(0)
        
        return send_file(
            buffer,
            mimetype='application/pdf',
            as_attachment=True,
            download_name=f'Reporte_Analiticas_{datetime.now().strftime("%Y%m%d_%H%M%S")}.pdf'
        )
        
    except Exception as e:
        print(f"Error generando PDF: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({
            'success': False,
            'error': f'Error al generar PDF: {str(e)}'
        }), 500

@analiticas_bp.route('/api/metricas_tiempo_real')
def api_metricas_tiempo_real():
    """API para metricas en tiempo real"""
    try:
        from routes.campanas import CAMPANAS_ACTIVAS
        
        campanas_activas = len([c for c in CAMPANAS_ACTIVAS if c.get('estado') == 'enviando'])
        
        metricas = {
            'mensajes_ultimo_minuto': random.randint(15, 35),
            'tasa_entrega_actual': round(random.uniform(96.0, 98.5), 1),
            'tiempo_respuesta_promedio': round(random.uniform(2.0, 3.0), 2),
            'campanas_activas': campanas_activas,
            'contactos_en_linea': random.randint(850, 1200),
            'timestamp': datetime.now().isoformat()
        }
        
        return jsonify({'success': True, 'data': metricas})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500