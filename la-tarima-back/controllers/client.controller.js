// controllers/client.controller.js
// Este archivo define los controladores para manejar las operaciones relacionadas con los clientes en la aplicación.
// Cada función exportada en este archivo corresponde a una operación específica, como crear un cliente, obtener clientes, actualizar un cliente o eliminar un cliente.
// Estas funciones interactúan con el modelo de cliente para realizar las operaciones necesarias en la base de datos y responden con los resultados adecuados al cliente que realiza la solicitud.
// Importamos el modelo de cliente para interactuar con la base de datos
// Función para escapar caracteres especiales en regex
// Esta función se utiliza para escapar caracteres especiales en las búsquedas de texto, lo que ayuda a evitar problemas con la sintaxis de expresiones regulares (regex) al realizar consultas de búsqueda en la base de datos. 
// Al escapar estos caracteres, nos aseguramos de que se traten como texto literal en lugar de comandos regex, lo que mejora la seguridad y la precisión de las búsquedas.
const Client = require('../models/client') // Importamos el modelo de cliente

// Función para escapar caracteres especiales en regex
const escapeRegex = (text) => // esto sirve para evitar que caracteres especiales en la búsqueda de texto causen problemas en la consulta regex. 
                              // Por ejemplo, si el usuario busca "John (Doe)", los paréntesis podrían interpretarse como parte de la sintaxis regex, 
                              // lo que podría causar errores o resultados inesperados. Al escapar estos caracteres, nos aseguramos de que se traten 
                              // como texto literal en lugar de comandos regex.
  text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&') // Escapa caracteres especiales para uso en regex, es decir, 
                                              // reemplaza cualquier carácter que tenga un significado especial en regex con su versión escapada 
                                              // (precedida por una barra invertida) para que se trate como texto literal en las búsquedas de texto.

/**
 * CREATE CLIENT // esta función permite crear un nuevo cliente en la base de datos. 
 * Requiere que se proporcionen el nombre completo (fullname) y el documento de identificación (docID) del cliente. 
 * Si alguno de estos campos falta, la función responde con un error 400 indicando que ambos campos son obligatorios. 
 * Si el cliente se crea exitosamente, la función responde con un estado 201 (Creado) y el objeto del cliente recién creado en formato JSON. 
 * Si ocurre un error durante el proceso de creación, como una violación de la restricción de unicidad para docID, la función maneja el error y responde con un mensaje adecuado.
 */
exports.create = async (req, res) => { // Controlador para crear un nuevo cliente
  try {
    const { fullname, docID } = req.body // Extraemos fullname y docID del cuerpo de la solicitud
    if (!fullname || !docID) { // Validamos que fullname y docID sean proporcionados
      return res.status(400).json({ // Si falta alguno de los campos, respondemos con un error 400
        message: 'fullname y docID son obligatorios' // El mensaje de error indica que ambos campos son necesarios para crear un cliente
      }) // Si fullname y docID son proporcionados, procedemos a crear un nuevo cliente en la base de datos.
    } // Creamos una nueva instancia del modelo Client con los datos proporcionados en el cuerpo de la solicitud
    const client = new Client(req.body) // Creamos una nueva instancia del modelo Client con los datos proporcionados en el cuerpo de la solicitud
    await client.save() // Guardamos el nuevo cliente en la base de datos. Si el docID ya existe, esto lanzará un error debido a la restricción de unicidad definida en el modelo.
    res.status(201).json(client) // Si el cliente se crea exitosamente, respondemos con un estado 201 (Creado) y el objeto del cliente recién creado en formato JSON
  } catch (error) { // Si ocurre un error durante el proceso de creación, lo manejamos aquí
    if (error.code === 11000) { // Este código de error específico indica que se ha violado la restricción de unicidad, lo que significa que ya existe un cliente con el mismo docID en la base de datos
      return res.status(409).json({ // Respondemos con un error 409 (Conflicto) para indicar que el docID ya está en uso
        message: 'Ya existe un cliente con ese documento' 
      }) // Si el error no es una violación de la restricción de unicidad, manejamos cualquier otro tipo de error que pueda ocurrir durante el proceso de creación del cliente.
    } //
    res.status(500).json({ // Para cualquier otro tipo de error, respondemos con un error 500 (Error Interno del Servidor)
      message: 'Error al crear el cliente', // El mensaje de error indica que hubo un problema al intentar crear el cliente
      error: error.message // Incluimos el mensaje de error específico para ayudar a diagnosticar el problema
    }) // Esto ayuda a identificar si el error se debió a un problema con la base de datos, una validación fallida o cualquier otro tipo de error que pueda ocurrir durante el proceso de creación del cliente.
  } // Si el cliente se crea exitosamente, respondemos con un estado 201 (Creado) y el objeto del cliente recién creado en formato JSON.
} // La función create permite crear un nuevo cliente en la base de datos, asegurándose de que se proporcionen los campos necesarios y manejando adecuadamente los errores que puedan ocurrir durante el proceso de creación.

/**
 * GET ALL + FILTERS + PAGINATION // esta función permite obtener una lista de clientes con soporte para filtros y paginación. 
 * Los filtros permiten a los usuarios buscar clientes específicos basados en diferentes criterios, como docID, teléfono, correo electrónico, nombre completo, dirección o notas. 
 * La paginación permite dividir los resultados en páginas para mejorar la experiencia del usuario y evitar sobrecargar la respuesta con demasiados datos a la vez.
 * La función procesa los parámetros de consulta (query) para aplicar los filtros y la paginación, y luego responde con un objeto JSON que incluye la información de paginación (total, página actual, límite por página, total de páginas) y los datos de los clientes obtenidos que coinciden con los filtros aplicados.
 * Si ocurre un error durante el proceso de obtención de clientes, la función maneja el error y responde con un mensaje adecuado.
 */
exports.getAll = async (req, res) => { // Controlador para obtener todos los clientes, con soporte para filtros y paginación
  try { // Creamos un objeto vacío para almacenar los filtros que se aplicarán a la consulta de clientes
    const filters = {} // Verificamos cada posible filtro en los parámetros de consulta (query) y, si están presentes, los agregamos al objeto de filtros.
    if (req.query.docID)  filters.docID = req.query.docID // Si se proporciona un docID en los parámetros de consulta, 
                                                          // lo agregamos a los filtros para buscar clientes con ese docID específico
    if (req.query.phone)  filters.phone = req.query.phone // Si se proporciona un número de teléfono en los parámetros de consulta, 
                                                          // lo agregamos a los filtros para buscar clientes con ese número de teléfono específico
    if (req.query.email)  filters.email = req.query.email // Si se proporciona un correo electrónico en los parámetros de consulta, 
                                                          // lo agregamos a los filtros para buscar clientes con ese correo electrónico específico
    if (req.query.fullname) { // Si se proporciona un nombre completo en los parámetros de consulta,
      filters.fullname = { // agregamos un filtro para buscar clientes cuyo nombre completo coincida parcialmente con el valor proporcionado, 
                          // utilizando una expresión regular (regex) para permitir coincidencias flexibles y sin importar mayúsculas o minúsculas.
        $regex: escapeRegex(req.query.fullname), // La función escapeRegex se utiliza para escapar cualquier carácter especial en el valor de fullname,
        $options: 'i' // La opción 'i' hace que la búsqueda sea insensible a mayúsculas, lo que significa que "John Doe", "john doe" y "JOHN DOE" serían considerados iguales en la búsqueda.
      }
    }
    if (req.query.address) { // Si se proporciona una dirección en los parámetros de consulta, 
                            // agregamos un filtro similar al de fullname para buscar clientes cuya dirección coincida parcialmente con el valor proporcionado, 
                            // utilizando una expresión regular para permitir coincidencias flexibles e insensibles a mayúsculas.
      filters.address = { // Agregamos un filtro para la dirección utilizando una expresión regular
        $regex: escapeRegex(req.query.address), // Escapamos cualquier carácter especial en el valor de address para evitar problemas con la sintaxis de regex
        $options: 'i' // La opción 'i' hace que la búsqueda sea insensible a mayúsculas, 
                      // lo que significa que "123 Main St", "123 main st" y "123 MAIN ST" serían considerados iguales en la búsqueda.
      }
    }
    if (req.query.notes) { // Si se proporciona un valor para notas en los parámetros de consulta, 
                          // agregamos un filtro similar a los anteriores para buscar clientes cuyas notas coincidan parcialmente con el valor proporcionado,
      filters.notes = { // Agregamos un filtro para las notas utilizando una expresión regular
        $regex: escapeRegex(req.query.notes), // Escapamos cualquier carácter especial en el valor de notes para evitar problemas con la sintaxis de regex
        $options: 'i' // La opción 'i' hace que la búsqueda sea insensible a mayúsculas, 
                      // lo que significa que "Cliente VIP", "cliente vip" y "CLIENTE VIP" serían considerados iguales en la búsqueda.
      }
    }
    const page  = parseInt(req.query.page)  || 1 // Obtenemos el número de página de los parámetros de consulta, 
                                                // o usamos 1 como valor predeterminado si no se proporciona
    const limit = Math.min(parseInt(req.query.limit) || 10, 100) // Obtenemos el límite de resultados por página de los parámetros de consulta,
                                                // o usamos 10 como valor predeterminado si no se proporciona, y limitamos el máximo a 100 para evitar consultas excesivamente grandes
    const skip  = (page - 1) * limit // Calculamos el número de documentos a omitir (skip) para la paginación,
                                                // basado en el número de página y el límite de resultados por página
    const [clients, total] = await Promise.all([ // Ejecutamos dos consultas en paralelo utilizando Promise.all: 
                                                // una para obtener los clientes que coinciden con los filtros y la paginación,
      Client.find(filters) // La primera consulta busca clientes en la base de datos que coincidan con los filtros aplicados,
        .sort({ fullname: 1 }) // ordenamos los resultados por el campo fullname en orden ascendente (A-Z)
        .skip(skip) // aplicamos el número de documentos a omitir para la paginación, 
                    // lo que nos permite obtener el conjunto correcto de resultados para la página solicitada
        .limit(limit), // limitamos el número de resultados devueltos por la consulta al valor especificado en el límite para la paginación
      Client.countDocuments(filters) // La segunda consulta cuenta el número total de clientes que coinciden con los filtros aplicados,
                                  // lo que nos permite calcular el número total de páginas disponibles para la paginación
    ])
    res.json({ // Respondemos con un objeto JSON que incluye la información de paginación y los datos de los clientes obtenidos
      total, // El número total de clientes que coinciden con los filtros aplicados, 
              // lo que nos permite calcular el número total de páginas disponibles para la paginación
      page, // El número de página actual, basado en el valor proporcionado en los parámetros de consulta o el valor predeterminado
      limit, // El número de resultados por página, basado en el valor proporcionado en los parámetros de consulta o el valor predeterminado
      pages: Math.ceil(total / limit), // El número total de páginas disponibles para la paginación, 
                                        // calculado dividiendo el total de clientes por el límite de resultados por página y redondeando hacia arriba
      data: clients // El array de clientes obtenidos de la base de datos que coinciden con los filtros aplicados y la paginación,
                    // que se incluye en la respuesta JSON para que el cliente pueda mostrar los resultados al usuario
    }) // Respondemos con un objeto JSON que incluye la información de paginación y los datos de los clientes obtenidos
  } catch (error) { // Si ocurre un error durante el proceso de obtención de clientes, lo manejamos aquí
    res.status(500).json({ // Respondemos con un error 500 (Error Interno del Servidor) si ocurre un error al obtener los clientes
      message: 'Error al obtener clientes', // El mensaje de error indica que hubo un problema al intentar obtener los clientes
      error: error.message // Incluimos el mensaje de error específico para ayudar a diagnosticar el problema
    })
  }
}

/**
 * GET BY DOC // sirve para obtener un cliente específico de la base de datos utilizando su documento de identificación (docID) como criterio de búsqueda. 
 * La función busca un cliente que coincida con el docID proporcionado en los parámetros de la URL. 
 * Si se encuentra un cliente con ese docID, la función responde con el objeto del cliente en formato JSON. 
 * Si no se encuentra ningún cliente con ese docID, la función responde con un error 404 indicando que el cliente no fue encontrado. 
 * Si ocurre un error durante el proceso de búsqueda, la función maneja el error y responde con un mensaje adecuado.
 */
exports.getByDoc = async (req, res) => { // Controlador para obtener un cliente específico por su documento de identificación (docID)
  try { // Buscamos un cliente en la base de datos que coincida con el docID proporcionado en los parámetros de la URL
    const client = await Client.findOne({ docID: req.params.docID }) // La función findOne busca un solo documento en la colección de clientes que coincida 
                                                                    // con el criterio de búsqueda (docID igual al valor proporcionado en los parámetros de la URL)
    if (!client) { // Si no se encuentra ningún cliente con ese docID, respondemos con un error 404 (No Encontrado)
      return res.status(404).json({ // Respondemos con un error 404 (No Encontrado) si no se encuentra ningún cliente con el docID proporcionado
        message: 'Cliente no encontrado' // El mensaje de error indica que no se pudo encontrar un cliente con el docID especificado en la URL
      })
    } // Si se encuentra un cliente con ese docID, respondemos con el objeto del cliente en formato JSON
    res.json(client) // Respondemos con el objeto del cliente encontrado en formato JSON, 
                      // lo que permite al cliente mostrar los detalles del cliente al usuario
  } catch (error) { // Si ocurre un error durante el proceso de búsqueda, lo manejamos aquí
    res.status(500).json({ // Respondemos con un error 500 (Error Interno del Servidor) si ocurre un error al buscar el cliente
      message: 'Error al buscar cliente', // El mensaje de error indica que hubo un problema al intentar buscar el cliente por su docID
      error: error.message // Incluimos el mensaje de error específico para ayudar a diagnosticar el problema que ocurrió durante la búsqueda del cliente
    })
  }
}

/**
 * UPDATE CLIENT (PATCH — actualización parcial)
 * // esta función permite actualizar la información de un cliente existente en la base de datos utilizando su documento de identificación (docID) como criterio de búsqueda. 
 * La función acepta datos de actualización en el cuerpo de la solicitud (req.body) y solo actualiza los campos que se permiten modificar (fullname, email, phone, address, notes). 
 * Si no se proporciona ningún campo válido para actualizar, la función responde con un error 400 indicando que se debe enviar al menos un campo válido. 
 * Si se encuentra un cliente con el docID proporcionado, la función actualiza los campos permitidos con los nuevos valores y responde con el objeto del cliente actualizado en formato JSON. 
 * Si no se encuentra ningún cliente con ese docID, la función responde con un error 404 indicando que el cliente no fue encontrado. 
 * Si ocurre un error durante el proceso de actualización, la función maneja el error y responde con un mensaje adecuado.
 */
exports.update = async (req, res) => { // Controlador para actualizar la información de un cliente existente por su documento de identificación (docID) 
                                        // utilizando una actualización parcial (PATCH)
  try { // Definimos un array de campos permitidos para actualizar, lo que ayuda a garantizar que solo se modifiquen los campos autorizados
        //  y evita cambios no deseados en otros campos del cliente
    const allowedFields = ['fullname', 'email', 'phone', 'address', 'notes'] // Este array define los campos que se permiten actualizar en la información del cliente.
    const updateData = {} // Creamos un objeto vacío para almacenar los datos de actualización que se enviarán a la base de datos.
    allowedFields.forEach(field => { // Iteramos sobre cada campo permitido para actualizar y verificamos si se proporciona un nuevo valor para ese campo en el cuerpo de la solicitud (req.body).
      if (req.body[field] !== undefined) { // Si se proporciona un nuevo valor para el campo (es decir, no es undefined), lo agregamos al objeto de actualización (updateData) con el nuevo valor.
        updateData[field] = req.body[field] // Esto asegura que solo los campos permitidos que se proporcionen en la solicitud sean incluidos en la actualización,
      }// y evita que se actualicen campos no autorizados o que se establezcan en undefined si no se proporcionan en la solicitud.
    })
    if (Object.keys(updateData).length === 0) { // Si no se proporciona ningún campo válido para actualizar (es decir, el objeto de actualización está vacío), respondemos con un error 400 (Solicitud Incorrecta) indicando que se debe enviar al menos un campo válido para actualizar.
      return res.status(400).json({ // Respondemos con un error 400 (Solicitud Incorrecta) si no se proporciona ningún campo válido para actualizar en el cuerpo de la solicitud
        message: 'Debe enviar al menos un campo válido para actualizar' // El mensaje de error indica que se debe enviar al menos un campo válido (fullname, email, phone, address o notes) para actualizar la información del cliente
      })// Si se encuentra un cliente con el docID proporcionado, actualizamos los campos permitidos con los nuevos valores y respondemos con el objeto del cliente actualizado en formato JSON.
    } // La función findOneAndUpdate busca un cliente en la base de datos que coincida con el docID proporcionado en los parámetros de la URL y actualiza los campos permitidos con los nuevos valores proporcionados en el cuerpo de la solicitud (updateData).
    const client = await Client.findOneAndUpdate( // La función findOneAndUpdate busca un cliente en la base de datos que coincida con el docID 
                                                  // proporcionado en los parámetros de la URL y actualiza los campos permitidos con los nuevos valores 
                                                  // proporcionados en el cuerpo de la solicitud (updateData).
      { docID: req.params.docID },// El primer argumento es el criterio de búsqueda para encontrar el cliente que se desea actualizar, 
                                  // en este caso, el docID igual al valor proporcionado en los parámetros de la URL.
      updateData,// El segundo argumento es el objeto de actualización que contiene los campos permitidos con los nuevos valores que 
                  // se desean actualizar en el cliente encontrado.
      { // El tercer argumento son las opciones para la función findOneAndUpdate.
        new: true, // La opción 'new: true' hace que la función devuelva el cliente actualizado en lugar del cliente original antes de la actualización.
        runValidators: true // La opción 'runValidators: true' asegura que se apliquen las validaciones definidas en el modelo de cliente al actualizar los campos,
                          // lo que ayuda a garantizar que los datos actualizados cumplan con las reglas de validación establecidas en el modelo.
      }// Si no se encuentra ningún cliente con ese docID, respondemos con un error 404 (No Encontrado) indicando que el cliente no fue encontrado.
    ) // Si se encuentra un cliente con ese docID, actualizamos los campos permitidos con los nuevos valores y respondemos con el objeto del cliente actualizado en formato JSON.
    if (!client) { // Si no se encuentra ningún cliente con ese docID, respondemos con un error 404 (No Encontrado)
      return res.status(404).json({ // Respondemos con un error 404 (No Encontrado) si no se encuentra ningún cliente con el docID proporcionado en los parámetros de la URL
        message: 'Cliente no encontrado' // El mensaje de error indica que no se pudo encontrar un cliente con el docID especificado en la URL para actualizar su información
      })// Si se encuentra un cliente con ese docID, actualizamos los campos permitidos con los nuevos valores y respondemos con el objeto del cliente actualizado en formato JSON.
    }
    res.json(client) // Respondemos con el objeto del cliente actualizado en formato JSON, lo que permite al cliente mostrar los detalles actualizados del cliente al usuario
  } catch (error) { // Si ocurre un error durante el proceso de actualización, lo manejamos aquí
    res.status(500).json({ // Respondemos con un error 500 (Error Interno del Servidor) si ocurre un error al actualizar la información del cliente
      message: 'Error al actualizar cliente', // El mensaje de error indica que hubo un problema al intentar actualizar la información del cliente
      error: error.message // Incluimos el mensaje de error específico para ayudar a diagnosticar el problema que ocurrió durante la actualización del cliente
    }) // Esto ayuda a identificar si el error se debió a un problema con la base de datos, una validación fallida o cualquier otro tipo de error que pueda ocurrir durante el proceso de actualización del cliente.
  }// Si se encuentra un cliente con ese docID, actualizamos los campos permitidos con los nuevos valores y respondemos con el objeto del cliente actualizado en formato JSON.  
} // La función findOneAndUpdate busca un cliente en la base de datos que coincida con el docID proporcionado en los parámetros de la URL y actualiza los campos permitidos con los nuevos valores proporcionados en el cuerpo de la solicitud (updateData).

/**
 * DELETE CLIENT
 * esta función permite eliminar un cliente existente de la base de datos utilizando su documento de identificación (docID) como criterio de búsqueda. 
 * La función busca un cliente que coincida con el docID proporcionado en los parámetros de la URL y lo elimina de la base de datos. 
 * Si se encuentra un cliente con ese docID, lo eliminamos de la base de datos y respondemos con un mensaje indicando que el cliente fue eliminado correctamente. 
 * Si no se encuentra ningún cliente con ese docID, la función responde con un error 404 indicando que el cliente no fue encontrado. 
 * Si ocurre un error durante el proceso de eliminación, la función maneja el error y responde con un mensaje adecuado.
 */
exports.remove = async (req, res) => { // Controlador para eliminar un cliente existente por su documento de identificación (docID)
  try { // La función findOneAndDelete busca un cliente en la base de datos que coincida con el docID proporcionado en los parámetros de la URL y lo elimina de la base de datos.
    const client = await Client.findOneAndDelete({ // La función findOneAndDelete busca un cliente en la base de datos que coincida con el docID proporcionado en los parámetros de la URL y lo elimina de la base de datos.
      docID: req.params.docID // El argumento es el criterio de búsqueda para encontrar el cliente que se desea eliminar,
                              // en este caso, el docID igual al valor proporcionado en los parámetros de la URL.
    }) // Si no se encuentra ningún cliente con ese docID, respondemos con un error 404 (No Encontrado) indicando que el cliente no fue encontrado.
    if (!client) { // Si no se encuentra ningún cliente con ese docID, respondemos con un error 404 (No Encontrado)
      return res.status(404).json({ // Respondemos con un error 404 (No Encontrado) si no se encuentra ningún cliente con el docID proporcionado en los parámetros de la URL
        message: 'Cliente no encontrado' // El mensaje de error indica que no se pudo encontrar un cliente con el docID especificado en la URL para eliminarlo de la base de datos
      }) // Si se encuentra un cliente con ese docID, lo eliminamos de la base de datos y respondemos con un mensaje indicando que el cliente fue eliminado correctamente.
    }
    res.json({ // Respondemos con un mensaje JSON que indica que el cliente fue eliminado correctamente, lo que permite al cliente mostrar una confirmación al usuario de que la eliminación se realizó con éxito.
      message: 'Cliente eliminado correctamente' // El mensaje indica que el cliente fue eliminado correctamente de la base de datos, lo que confirma que la operación de eliminación se realizó con éxito.
    }) // Si se encuentra un cliente con ese docID, lo eliminamos de la base de datos y respondemos con un mensaje indicando que el cliente fue eliminado correctamente.
  } catch (error) { // Si ocurre un error durante el proceso de eliminación, lo manejamos aquí
    res.status(500).json({ // Respondemos con un error 500 (Error Interno del Servidor) si ocurre un error al eliminar el cliente
      message: 'Error al eliminar cliente', // El mensaje de error indica que hubo un problema al intentar eliminar el cliente de la base de datos
      error: error.message // Incluimos el mensaje de error específico para ayudar a diagnosticar el problema que ocurrió durante la eliminación del cliente,
    }) // Esto ayuda a identificar si el error se debió a un problema con la base de datos, una restricción de integridad o cualquier otro tipo de error que pueda ocurrir durante el proceso de eliminación del cliente.
  } // Si se encuentra un cliente con ese docID, lo eliminamos de la base de datos y respondemos con un mensaje indicando que el cliente fue eliminado correctamente.
} // La función findOneAndDelete busca un cliente en la base de datos que coincida con el docID proporcionado en los parámetros de la URL y lo elimina de la base de datos.