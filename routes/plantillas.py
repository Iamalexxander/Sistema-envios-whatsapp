from flask import Blueprint, render_template, request, jsonify
from models.plantilla import PlantillaModel

plantillas_bp = Blueprint('plantillas', __name__)
plantilla_model = PlantillaModel()

@plantillas_bp.route('/plantillas')
def index():
    """Página principal de plantillas"""
    return render_template('plantillas/plantillas.html')

@plantillas_bp.route('/plantillas/api', methods=['GET'])
def api_obtener_plantillas():
    """API para obtener todas las plantillas"""
    try:
        plantillas = plantilla_model.obtener_todas()
        return jsonify({
            'success': True,
            'data': plantillas,
            'total': len(plantillas)
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@plantillas_bp.route('/plantillas/api/<int:plantilla_id>', methods=['GET'])
def api_obtener_plantilla(plantilla_id):
    """API para obtener una plantilla específica"""
    try:
        plantilla = plantilla_model.obtener_por_id(plantilla_id)
        if plantilla:
            return jsonify({
                'success': True,
                'data': plantilla
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Plantilla no encontrada'
            }), 404
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@plantillas_bp.route('/plantillas/api', methods=['POST'])
def api_crear_plantilla():
    """API para crear una nueva plantilla"""
    try:
        datos = request.json
        
        if not datos or not datos.get('nombre') or not datos.get('contenido'):
            return jsonify({
                'success': False,
                'error': 'Nombre y contenido son requeridos'
            }), 400
        
        nueva_plantilla = plantilla_model.crear(datos)
        
        return jsonify({
            'success': True,
            'data': nueva_plantilla,
            'message': 'Plantilla creada exitosamente'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@plantillas_bp.route('/plantillas/api/<int:plantilla_id>', methods=['PUT'])
def api_actualizar_plantilla(plantilla_id):
    """API para actualizar una plantilla"""
    try:
        datos = request.json
        
        if not datos or not datos.get('nombre') or not datos.get('contenido'):
            return jsonify({
                'success': False,
                'error': 'Nombre y contenido son requeridos'
            }), 400
        
        plantilla_actualizada = plantilla_model.actualizar(plantilla_id, datos)
        
        if plantilla_actualizada:
            return jsonify({
                'success': True,
                'data': plantilla_actualizada,
                'message': 'Plantilla actualizada exitosamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Plantilla no encontrada'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@plantillas_bp.route('/plantillas/api/<int:plantilla_id>', methods=['DELETE'])
def api_eliminar_plantilla(plantilla_id):
    """API para eliminar una plantilla"""
    try:
        eliminada = plantilla_model.eliminar(plantilla_id)
        
        if eliminada:
            return jsonify({
                'success': True,
                'message': 'Plantilla eliminada exitosamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Plantilla no encontrada'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@plantillas_bp.route('/plantillas/api/buscar', methods=['GET'])
def api_buscar_plantillas():
    """API para buscar plantillas"""
    try:
        termino = request.args.get('q', '')
        
        if not termino:
            return jsonify({
                'success': False,
                'error': 'Término de búsqueda requerido'
            }), 400
        
        resultados = plantilla_model.buscar(termino)
        
        return jsonify({
            'success': True,
            'data': resultados,
            'total': len(resultados)
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@plantillas_bp.route('/plantillas/categorias/api', methods=['GET'])
def api_obtener_categorias():
    """API para obtener todas las categorías"""
    try:
        categorias = plantilla_model.obtener_categorias()
        return jsonify({
            'success': True,
            'data': categorias
        })
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@plantillas_bp.route('/plantillas/categorias/api', methods=['POST'])
def api_crear_categoria():
    """API para crear una nueva categoría"""
    try:
        datos = request.json
        
        if not datos or not datos.get('nombre'):
            return jsonify({
                'success': False,
                'error': 'Nombre de categoría requerido'
            }), 400
        
        nueva_categoria = plantilla_model.crear_categoria(
            datos['nombre'],
            datos.get('color', '#25d366')
        )
        
        return jsonify({
            'success': True,
            'data': nueva_categoria,
            'message': 'Categoría creada exitosamente'
        })
        
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@plantillas_bp.route('/plantillas/categorias/api/<int:categoria_id>', methods=['DELETE'])
def api_eliminar_categoria(categoria_id):
    """API para eliminar una categoría"""
    try:
        eliminada = plantilla_model.eliminar_categoria(categoria_id)
        
        if eliminada:
            return jsonify({
                'success': True,
                'message': 'Categoría eliminada exitosamente'
            })
        else:
            return jsonify({
                'success': False,
                'error': 'Categoría no encontrada'
            }), 404
            
    except Exception as e:
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500