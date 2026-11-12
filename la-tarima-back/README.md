# 🎵 Sistema de Reservas y Gestión de Bar – La Tarima

**API REST completa para gestionar un bar con reservas, órdenes, pagos, descuentos y reportes.**

---

## 📋 Tabla de Contenidos

1. [Descripción General](#descripción-general)
2. [Características Principales](#características-principales)
3. [Tecnologías Utilizadas](#tecnologías-utilizadas)
4. [Requisitos Previos](#requisitos-previos)
5. [Instalación](#instalación)
6. [Configuración del Entorno](#configuración-del-entorno)
7. [Estructura del Proyecto](#estructura-del-proyecto)
8. [Arquitectura y Patrones](#arquitectura-y-patrones)
9. [Modelos de Datos](#modelos-de-datos)
10. [Endpoints de la API](#endpoints-de-la-api)
11. [Ejemplos de Uso](#ejemplos-de-uso)
12. [Reglas de Negocio](#reglas-de-negocio)
13. [Manejo de Errores](#manejo-de-errores)
14. [Desarrollo Local](#desarrollo-local)
15. [Pendientes y Mejoras Futuras](#pendientes-y-mejoras-futuras)
16. [Solución de Problemas](#solución-de-problemas)

---

## 📱 Descripción General

La Tarima es un **Sistema integral de gestión para bares con presentaciones en vivo**. Proporciona una API REST robusta que permite:

- ✅ **Gestión de Reservas**: Crear, modificar y cancelar reservas
- ✅ **Administración de Mesas**: Control del estado y disponibilidad
- ✅ **Catálogo de Productos**: Bebidas, comidas y especialidades
- ✅ **Gestión de Órdenes**: Crear y rastrear órdenes desde la cocina
- ✅ **Sistema de Pagos**: Múltiples métodos de pago y splits de cuentas
- ✅ **Descuentos y Cupones**: Promociones automáticas o por código
- ✅ **Gestión de Personal**: Meseros, bartenders, chefs
- ✅ **Reportes y Auditoría**: Análisis de ventas, clientes frecuentes, etc.
- ✅ **Clientes**: Registro y gestión de clientes frecuentes

---

## ✨ Características Principales

### Reservas Inteligentes
- Sistema de disponibilidad en tiempo real
- Validación de conflictos de horarios
- Sincronización automática del estado de mesas
- Soporte para clientes registrados e invitados
- Control de estados: pendiente → confirmada → en_curso → completada/cancelada

### Gestión de Órdenes Completa
- Órdenes vinculadas a reservas
- Rastreo de estado: abierto → enviado_cocina → en_preparación → listo → servido
- Notas para la cocina
- Control de items con cantidad y precio

### Sistema de Pagos Flexible
- Múltiples métodos: efectivo, tarjeta, Nequi, Daviplata
- Pagos por orden o por reserva completa
- División de cuentas (split payment)
- Propinas y descuentos aplicables

### Descuentos Avanzados
- Cupones con código
- Descuentos automáticos por cliente
- Descuentos por porcentaje o cantidad fija
- Control de validez temporal y máximo de usos
- Descuentos apilables (stackable)

### Reportes Detallados
- Ventas por categoría
- Clientes principales
- Pagos por rango de fechas
- Ventas por producto

---

## 🛠 Tecnologías Utilizadas

| Categoría | Tecnología | Versión |
|-----------|-----------|---------|
| **Runtime** | Node.js | v18+ |
| **Framework** | Express.js | 4.18.2 |
| **Base de Datos** | MongoDB | (Local o Atlas) |
| **ODM** | Mongoose | 7.3.0 |
| **Validación** | express-validator | 7.0.1 |
| **CORS** | cors | 2.8.6 |
| **Variables de Entorno** | dotenv | 16.6.1 |
| **Carga de Archivos** | multer | 2.1.1 |
| **Dev Tool** | Nodemon | 2.0.22 |

---

## 📦 Requisitos Previos

### Software Necesario

```bash
# Node.js (incluye npm)
node --version  # Debe ser v18.0.0 o superior
npm --version   # Debe ser v9.0.0 o superior

# MongoDB (opción local)
mongod --version  # Debe estar instalado
```

### Opciones de MongoDB

**Opción 1: MongoDB Local (Recomendado para desarrollo)**
```bash
# Descargar de: https://www.mongodb.com/try/download/community
# Instalar y asegurarse de que el servicio está corriendo
# Por defecto escucha en: mongodb://127.0.0.1:27017
```

**Opción 2: MongoDB Atlas (Cloud)**
```bash
# Crear cuenta en: https://www.mongodb.com/cloud/atlas
# Obtener connection string: mongodb+srv://usuario:contraseña@cluster.mongodb.net/La_Tarima
```

---

## 🚀 Instalación

### Paso 1: Clonar o Descargar el Proyecto

```bash
cd "tu-ruta/La Tarima API/la-tarima-back"
```

### Paso 2: Instalar Dependencias

```bash
# Instalar todas las dependencias de npm
npm install

# Esto descargará e instalará:
# - express
# - mongoose
# - cors
# - dotenv
# - express-validator
# - multer
# - jsonwebtoken
# - nodemailer
# - connect-multiparty
# - nodemon (para desarrollo)
```

### Paso 3: Verificar Instalación

```bash
# Listar dependencias instaladas
npm list

# Debe mostrar:
# ├── connect-multiparty@2.2.0
# ├── cors@2.8.6
# ├── dotenv@16.6.1
# ├── express@4.18.2
# ├── express-validator@7.0.1
# ├── mongoose@7.3.0
# └── multer@2.1.1
```

---

## ⚙️ Configuración del Entorno

### Paso 1: Crear Archivo .env

En la **raíz del proyecto** (`la-tarima-back`), crea un archivo llamado `.env`:

```bash
# Copiar desde el template
cp .env.example .env
```

### Paso 2: Configurar Variables de Entorno

Abre `.env` y configura:

```env
# ===== BASE DE DATOS =====
# Opción 1: MongoDB Local
MONGO_URI=mongodb://127.0.0.1:27017/La_Tarima

# Opción 2: MongoDB Atlas (comentar la línea anterior)
# MONGO_URI=mongodb+srv://usuario:contraseña@cluster0.mongodb.net/La_Tarima

# ===== SERVIDOR =====
PORT=3000
NODE_ENV=development

# ===== CORS =====
# La dirección de tu frontend (React/Vite)
CORS_ORIGIN=http://localhost:5173

# Para producción con frontend en otro dominio:
# CORS_ORIGIN=https://miapp.com
```

### Paso 3: Validar Configuración

```bash
# Verificar que MongoDB está corriendo
# Local
mongosh  # Debe conectar exitosamente

# O verificar con node
node -e "require('dotenv').config(); console.log('MONGO_URI:', process.env.MONGO_URI)"
```

---

## 📂 Estructura del Proyecto

```
la-tarima-back/
│
├── 📄 index.js                          # Punto de entrada - conexión a BD y servidor
├── 📄 app.js                            # Configuración de Express y rutas
├── 📄 package.json                      # Dependencias del proyecto
├── 📄 .env.example                      # Template de variables de entorno
├── 📄 .env                              # Variables de entorno (NO VERSIONAR)
├── 📄 README.md                         # Este archivo
│
├── 📁 controllers/                      # Lógica de negocio (CRUD + reglas)
│   ├── client.controller.js             # Gestión de clientes
│   ├── discount.controller.js           # Gestión de descuentos y cupones
│   ├── order.controller.js              # Gestión de órdenes
│   ├── payment.controller.js            # Gestión de pagos
│   ├── product.controller.js            # Gestión de productos
│   ├── report.controller.js             # Reportes y análisis
│   ├── reservation.controller.js        # Gestión de reservas (lógica compleja)
│   ├── reservationAccount.controller.js # Cuentas de reservas
│   ├── staff.controller.js              # Gestión del personal
│   └── table.controller.js              # Gestión de mesas
│
├── 📁 models/                           # Esquemas de MongoDB (Mongoose)
│   ├── client.js                        # Schema: Cliente
│   ├── counter.js                       # Schema: Contador para IDs
│   ├── discount.js                      # Schema: Descuento/Cupón
│   ├── order.js                         # Schema: Orden
│   ├── payment.js                       # Schema: Pago
│   ├── product.js                       # Schema: Producto
│   ├── reservation.js                   # Schema: Reserva
│   ├── staff.js                         # Schema: Staff/Personal
│   └── table.js                         # Schema: Mesa
│
├── 📁 routes/                           # Definición de endpoints HTTP
│   ├── client.routes.js                 # Rutas: /api/clients
│   ├── discount.routes.js               # Rutas: /api/discounts
│   ├── order.routes.js                  # Rutas: /api/orders
│   ├── payment.routes.js                # Rutas: /api/payments
│   ├── product.routes.js                # Rutas: /api/products
│   ├── report.routes.js                 # Rutas: /api/reports
│   ├── reservation.routes.js            # Rutas: /api/reservations
│   ├── reservationAccount.routes.js     # Rutas: /api/reservations-account
│   ├── staff.routes.js                  # Rutas: /api/staff
│   └── table.routes.js                  # Rutas: /api/tables
│
├── 📁 middlewares/                      # Funciones intermediarias
│   ├── client.middleware.js             # Validaciones para clientes
│   ├── discount.middleware.js           # Validaciones para descuentos
│   ├── errorHandler.middleware.js       # Manejo centralizado de errores
│   ├── order.middleware.js              # Validaciones para órdenes
│   ├── payment.middleware.js            # Validaciones para pagos
│   ├── product.middleware.js            # Validaciones para productos
│   ├── report.middleware.js             # Validaciones para reportes
│   ├── reservation.middleware.js        # Validaciones para reservas
│   ├── staff.middleware.js              # Validaciones para staff
│   ├── table.middleware.js              # Validaciones para mesas
│   └── upload.middleware.js             # Gestión de carga de archivos
│
├── 📁 utils/                            # Funciones de utilidad
│   ├── generateId.js                    # Generador automático de IDs únicos
│   └── reservationAccount.js            # Lógica de cuentas de reserva
│
├── 📁 uploads/                          # Almacenamiento de archivos subidos
│   └── products/                        # Imágenes de productos
│
└── 📁 .gitignore                        # Archivos a ignorar en Git
```

---

## 🏗 Arquitectura y Patrones

### Patrón MVC (Model-View-Controller)

```
REQUEST → ROUTES → MIDDLEWARE (Validación) → CONTROLLER (Lógica) → MODEL (BD) → RESPONSE
```

### Flujo de una Solicitud

```
1. Cliente envía HTTP REQUEST
   ↓
2. Express enruta a /api/endpoint
   ↓
3. MIDDLEWARE valida datos con express-validator
   ↓
4. Si hay errores → Retorna 400/422 (Bad Request)
   ↓
5. Si pasa validación → CONTROLLER procesa lógica
   ↓
6. Controller interactúa con MODEL (Mongoose)
   ↓
7. Mongoose ejecuta operaciones en MongoDB
   ↓
8. Response se retorna al cliente (JSON)
   ↓
9. ERROR HANDLER captura cualquier error no previsto
```

### Generación de IDs Únicos

El proyecto usa un **contador secuencial** en MongoDB para generar IDs legibles:

```javascript
// Ejemplo de IDs generados:
RES001, RES002, RES003...     // Reservas
ORD001, ORD002, ORD003...     // Órdenes
PAY001, PAY002, PAY003...     // Pagos
etc.
```

Esto facilita el tracking manual y es más legible que ObjectIds de MongoDB.

---

## 📊 Modelos de Datos

### 1. **Client** (Cliente)
Registra información de clientes frecuentes.

```javascript
{
  fullname: String,        // Nombre completo (requerido)
  phone: String,          // Teléfono (opcional)
  address: String,        // Dirección (opcional)
  docID: String,          // Documento único (requerido, único)
  email: String,          // Email validado (opcional)
  notes: String,          // Notas (opcional)
  timestamps: true        // createdAt, updatedAt automáticos
}
```

---

### 2. **Table** (Mesa)
Estado y configuración de mesas del establecimiento.

```javascript
{
  table_id: String,          // ID único de mesa
  tableNumber: Number,       // Número de mesa (1, 2, 3...)
  zone: String,             // Zona: "terraza", "interior", "vip"
  capacity: Number,         // Capacidad de personas (2-20)
  currentStatus: String,    // Estado actual:
                            //   - "libre"
                            //   - "reservada"
                            //   - "en_atencion"
                            //   - "limpieza"
  active: Boolean           // ¿Mesa activa?
}
```

**Estados de una Mesa:**
- `libre`: Disponible para nuevas reservas
- `reservada`: Tiene una reserva confirmada
- `en_atencion`: Clientes actualmente en la mesa
- `limpieza`: En proceso de limpieza después de uso

---

### 3. **Product** (Producto)
Catálogo de bebidas, comidas y especialidades.

```javascript
{
  product_id: String,     // ID único (P001, P002...)
  name: String,           // Nombre del producto
  category: String,       // "bebida", "comida", "otro"
  subcategory: String,    // "coctel", "cerveza", "licor", "vino", 
                          //   "snack", "entradas", "platos_fuertes",
                          //   "especialidades", "especial", "otro"
  basePrice: Number,      // Precio base en COP
  description: String,    // Descripción del producto
  imageUrl: String,       // URL de imagen o path
  active: Boolean,        // ¿Producto disponible?
  timestamps: true
}
```

---

### 4. **Reservation** (Reserva)
Gestión completa de reservas de mesas.

```javascript
{
  reservation_id: String,    // ID único (RES001, RES002...)
  table_id: String,         // Referencia a mesa
  date: String,             // Fecha de reserva (YYYY-MM-DD)
  startTime: String,        // Hora inicio (HH:mm)
  endTime: String,          // Hora fin (HH:mm)
  peopleCount: Number,      // Cantidad de personas
  status: String,           // "pendiente", "confirmada", "en_curso", 
                            //   "completada", "cancelada"
  channel: String,          // "presencial", "telefono", "web", "app"
  clientRef: {              // Cliente registrado (uno u otro)
    fullname: String,
    docID: String
  },
  guest: {                  // Invitado/cliente eventual
    fullname: String,
    phone: String,
    notes: String
  },
  waiter_id: String,        // Mesero asignado
  appliedCoupons: [{        // Descuentos aplicados
    discount_id: String,
    code: String,
    name: String,
    type: "percentage" | "fixed",
    value: Number,
    consumed: Boolean,
    appliedBy: String,
    appliedAt: Date
  }],
  notes: String,            // Notas especiales
  timestamps: true
}
```

**Regla Importante:** Una reserva DEBE tener EXACTAMENTE `clientRef` O `guest`, nunca ambos.

---

### 5. **Order** (Orden)
Órdenes de comida/bebida vinculadas a reservas.

```javascript
{
  order_id: String,          // ID único (ORD001, ORD002...)
  reservation_id: String,    // Referencia a reserva
  clientHint: String,        // Descripción rápida del cliente
  status: String,            // "abierto", "enviado_cocina", "en_preparacion",
                             //   "listo", "servido", "cancelado"
  items: [{                  // Array de productos
    product_id: String,
    name: String,
    quantity: Number,        // Cantidad
    unitPrice: Number        // Precio unitario
  }],
  subtotalAmount: Number,    // Total antes de impuestos/descuentos
  totalAmount: Number,       // Total final
  notes: String,             // Notas para cocina
  timestamps: true
}
```

**Flujo de Estados:**
```
abierto → enviado_cocina → en_preparacion → listo → servido
                                                  ↓
                                            (o cancelado)
```

---

### 6. **Payment** (Pago)
Registro de transacciones de pago.

```javascript
{
  payment_id: String,        // ID único (PAY001, PAY002...)
  reservation_id: String,    // Referencia a reserva
  order_id: String,          // Referencia a orden (opcional)
  scope: String,             // "order" o "reservation"
  amount: Number,            // Monto en COP
  method: String,            // "efectivo", "tarjeta", "nequi", "daviplata"
  tip: Number,               // Propina (opcional)
  status: String,            // "pendiente", "aprobado"
  split: {                   // División de pago (opcional)
    part: Number,            // Parte número (1, 2, 3...)
    totalParts: Number       // Total de partes (2, 3, 4...)
  },
  timestamps: true
}
```

**Métodos de Pago Soportados:**
- `efectivo`: Dinero en efectivo
- `tarjeta`: Tarjeta de crédito/débito
- `nequi`: App de transferencias Nequi
- `daviplata`: App de transferencias Daviplata

---

### 7. **Discount** (Descuento/Cupón)
Gestión de promociones, cupones y descuentos.

```javascript
{
  discount_id: String,       // ID único (DISC001...)
  name: String,              // Nombre de la promoción
  kind: String,              // "automatic" o "coupon"
  code: String,              // Código cupón (opcional, único)
  type: String,              // "percentage" (%) o "fixed" (cantidad fija)
  value: Number,             // Valor del descuento
  clientDocID: String,       // Si es automático, para qué cliente
  validFrom: Date,           // Válido desde
  validUntil: Date,          // Válido hasta
  maxUses: Number,           // Máximo de usos (opcional)
  usedCount: Number,         // Veces usados
  active: Boolean,           // ¿Activo?
  stackable: Boolean,        // ¿Se puede combinar con otros?
  appliedReservations: [{    // Historial de aplicación
    reservation_id: String,
    consumed: Boolean,
    consumedAt: Date
  }],
  timestamps: true
}
```

**Tipos de Descuentos:**
- `automatic`: Se aplica automáticamente a ciertos clientes
- `coupon`: Requiere código para aplicar manualmente

---

### 8. **Staff** (Personal)
Gestión del equipo de trabajo.

```javascript
{
  user_id: String,           // ID único (STAFF001...)
  fullname: String,          // Nombre completo
  role: String,              // "mesero", "barista", "chef", "gerente"
  email: String,             // Email
  phone: String,             // Teléfono
  active: Boolean,           // ¿Activo?
  timestamps: true
}
```

---

### Relaciones entre Modelos

```
┌─────────────┐
│   CLIENT    │  (Clientes registrados)
└──────┬──────┘
       │ (docID)
       │
       ├──────────────────────┐
       │                      │
       ▼                      ▼
┌──────────────┐      ┌────────────────┐
│ RESERVATION  │      │ DISCOUNTS      │
│ (clientRef)  │      │ (automatic)    │
└──────┬───────┘      └────────────────┘
       │
       ├─ appliedCoupons[] (descuentos aplicados)
       ├─ waiter_id → STAFF
       ├─ table_id → TABLE
       │
       ▼
    ┌─────────────┐
    │   ORDER     │
    └──────┬──────┘
           │
           ├─ items[] → PRODUCT
           │
           ▼
    ┌──────────────┐
    │   PAYMENT    │
    │ (scope)      │
    └──────────────┘
```

---

## 🔌 Endpoints de la API

### URL Base
```
http://localhost:3000/api
```

### Autenticación
Actualmente NO implementada. **TODO**: Agregar JWT.

---

### 👥 **CLIENTES** (`/api/clients`)

#### Crear Cliente
```http
POST /api/clients
Content-Type: application/json

{
  "fullname": "Felipe García",
  "phone": "3001234567",
  "address": "Calle 5 #10-20",
  "docID": "1234567890",
  "email": "juan@example.com",
  "notes": "Cliente frecuente"
}
```

**Response (201):**
```json
{
  "fullname": "Felipe García",
  "phone": "3001234567",
  "address": "Calle 5 #10-20",
  "docID": "1234567890",
  "email": "juan@example.com",
  "notes": "Cliente frecuente",
  "createdAt": "2024-05-09T10:30:00Z",
  "updatedAt": "2024-05-09T10:30:00Z"
}
```

#### Obtener Todos los Clientes
```http
GET /api/clients?limit=10&skip=0&search=juan
```

#### Obtener Cliente por docID
```http
GET /api/clients/1234567890
```

#### Actualizar Cliente
```http
PUT /api/clients/1234567890
Content-Type: application/json

{
  "phone": "3109876543",
  "notes": "Actualizado"
}
```

#### Eliminar Cliente
```http
DELETE /api/clients/1234567890
```

---

### 📦 **PRODUCTOS** (`/api/products`)

#### Crear Producto
```http
POST /api/products
Content-Type: application/json

{
  "name": "Mojito Clásico",
  "category": "bebida",
  "subcategory": "coctel",
  "basePrice": 32000,
  "description": "Bebida refrescante con ron, menta y limón",
  "imageUrl": "https://...",
  "active": true
}
```

#### Listar Productos
```http
GET /api/products?category=bebida&subcategory=coctel&limit=10
```

#### Obtener Producto
```http
GET /api/products/PROD001
```

#### Actualizar Producto
```http
PUT /api/products/PROD001
Content-Type: application/json

{
  "basePrice": 35000,
  "active": true
}
```

#### Eliminar Producto
```http
DELETE /api/products/PROD001
```

---

### 🪑 **MESAS** (`/api/tables`)

#### Crear Mesa
```http
POST /api/tables
Content-Type: application/json

{
  "tableNumber": 1,
  "zone": "interior",
  "capacity": 4,
  "active": true
}
```

#### Listar Mesas
```http
GET /api/tables?zone=interior&limit=20
```

#### Obtener Mesa
```http
GET /api/tables/TBL001
```

#### Actualizar Estado de Mesa
```http
PATCH /api/tables/TBL001
Content-Type: application/json

{
  "currentStatus": "libre"
}
```

#### Eliminar Mesa
```http
DELETE /api/tables/TBL001
```

---

### 👨‍💼 **STAFF** (`/api/staff`)

#### Crear Miembro del Staff
```http
POST /api/staff
Content-Type: application/json

{
  "fullname": "Carlos López",
  "role": "mesero",
  "email": "carlos@latarima.com",
  "phone": "3101234567",
  "active": true
}
```

**Roles disponibles:**
- `mesero`: Atiende mesas
- `barista`: Prepara bebidas
- `chef`: Cocina
- `gerente`: Administrador

#### Listar Staff
```http
GET /api/staff?role=mesero&active=true
```

#### Obtener Miembro
```http
GET /api/staff/STAFF001
```

#### Actualizar Staff
```http
PUT /api/staff/STAFF001
```

---

### 📅 **RESERVAS** (`/api/reservations`)

#### Verificar Disponibilidad
```http
GET /api/reservations/availability?table_id=TBL001&date=2024-05-15&startTime=19:00&endTime=21:00
```

**Response (200):**
```json
{
  "available": true,
  "reason": "Horario disponible"
}
```

#### Crear Reserva
```http
POST /api/reservations
Content-Type: application/json

{
  "table_id": "TBL001",
  "date": "2024-05-15",
  "startTime": "19:00",
  "endTime": "21:00",
  "peopleCount": 4,
  "channel": "presencial",
  "clientRef": {
    "docID": "1234567890",
    "fullname": "Juan Pérez"
  },
  "notes": "Cumpleaños - decorar mesa"
}
```

#### Listar Reservas
```http
GET /api/reservations?status=confirmada&limit=20&skip=0
```

#### Obtener Reserva
```http
GET /api/reservations/RES001
```

#### Aplicar Descuento a Reserva
```http
PATCH /api/reservations/RES001/apply-coupon
Content-Type: application/json

{
  "discountCode": "DESCUENTO20"
}
```

#### Cambiar Estado de Reserva
```http
PATCH /api/reservations/RES001
Content-Type: application/json

{
  "status": "en_curso"
}
```

#### Cancelar Reserva
```http
DELETE /api/reservations/RES001
```

---

### 🛒 **ÓRDENES** (`/api/orders`)

#### Crear Orden
```http
POST /api/orders
Content-Type: application/json

{
  "reservation_id": "RES001",
  "clientHint": "Juan Pérez - Mesa 1",
  "items": [
    {
      "product_id": "PROD001",
      "name": "Mojito Clásico",
      "quantity": 2,
      "unitPrice": 32000
    },
    {
      "product_id": "PROD005",
      "name": "Papas Fritas",
      "quantity": 1,
      "unitPrice": 16000
    }
  ],
  "notes": "Sin hielo en los mojitos"
}
```

#### Listar Órdenes
```http
GET /api/orders?reservation_id=RES001&status=servido&limit=10
```

#### Obtener Orden
```http
GET /api/orders/ORD001
```

#### Cambiar Estado de Orden
```http
PATCH /api/orders/ORD001/status
Content-Type: application/json

{
  "status": "en_preparacion"
}
```

#### Agregar Item a Orden
```http
PATCH /api/orders/ORD001/add-item
Content-Type: application/json

{
  "product_id": "PROD002",
  "name": "Cerveza Corona",
  "quantity": 1,
  "unitPrice": 12000
}
```

#### Eliminar Orden
```http
DELETE /api/orders/ORD001
```

---

### 💳 **PAGOS** (`/api/payments`)

#### Crear Pago
```http
POST /api/payments
Content-Type: application/json

{
  "reservation_id": "RES001",
  "order_id": "ORD001",
  "scope": "order",
  "amount": 80000,
  "method": "tarjeta",
  "tip": 5000,
  "status": "aprobado"
}
```

#### Pago Dividido (Split)
```json
{
  "reservation_id": "RES001",
  "amount": 40000,
  "method": "efectivo",
  "split": {
    "part": 1,
    "totalParts": 2
  }
}
```

#### Listar Pagos
```http
GET /api/payments?reservation_id=RES001&method=tarjeta
```

#### Obtener Pago
```http
GET /api/payments/PAY001
```

#### Actualizar Estado de Pago
```http
PATCH /api/payments/PAY001/status
Content-Type: application/json

{
  "status": "aprobado"
}
```

---

### 🎟️ **DESCUENTOS** (`/api/discounts`)

#### Crear Descuento/Cupón
```http
POST /api/discounts
Content-Type: application/json

{
  "name": "Descuento VIP",
  "kind": "coupon",
  "code": "VIP20",
  "type": "percentage",
  "value": 20,
  "validFrom": "2024-05-01T00:00:00Z",
  "validUntil": "2024-05-31T23:59:59Z",
  "maxUses": 100,
  "stackable": false,
  "active": true
}
```

#### Listar Descuentos
```http
GET /api/discounts?active=true&kind=coupon
```

#### Obtener Descuento
```http
GET /api/discounts/DISC001
```

#### Actualizar Descuento
```http
PUT /api/discounts/DISC001
```

#### Eliminar Descuento
```http
DELETE /api/discounts/DISC001
```

---

### 📊 **REPORTES** (`/api/reports`)

#### Ventas por Categoría
```http
GET /api/reports/sales-by-category?startDate=2024-05-01&endDate=2024-05-31
```

#### Clientes Principales
```http
GET /api/reports/top-clients?limit=10
```

#### Pagos por Rango de Fechas
```http
GET /api/reports/payments-by-date?startDate=2024-05-01&endDate=2024-05-31
```

#### Ventas por Producto
```http
GET /api/reports/sales-by-product?startDate=2024-05-01&endDate=2024-05-31&limit=20
```

---

## 📝 Ejemplos de Uso

### Flujo Completo: De Reserva a Pago

```bash
# 1. Crear cliente
curl -X POST http://localhost:3000/api/clients \
  -H "Content-Type: application/json" \
  -d '{"fullname":"Ana Martínez","docID":"9876543210","phone":"3117654321","email":"ana@example.com"}'

# 2. Verificar disponibilidad
curl http://localhost:3000/api/reservations/availability?table_id=TBL005&date=2024-05-20&startTime=20:00&endTime=22:00

# 3. Crear reserva
curl -X POST http://localhost:3000/api/reservations \
  -H "Content-Type: application/json" \
  -d '{"table_id":"TBL005","date":"2024-05-20","startTime":"20:00","endTime":"22:00","peopleCount":2,"channel":"web","clientRef":{"docID":"9876543210","fullname":"Ana Martínez"}}'

# 4. Confirmar reserva
curl -X PATCH http://localhost:3000/api/reservations/RES001 \
  -H "Content-Type: application/json" \
  -d '{"status":"confirmada"}'

# 5. Crear orden
curl -X POST http://localhost:3000/api/orders \
  -H "Content-Type: application/json" \
  -d '{"reservation_id":"RES001","items":[{"product_id":"PROD001","name":"Mojito","quantity":2,"unitPrice":32000}]}'

# 6. Cambiar estado: servido
curl -X PATCH http://localhost:3000/api/orders/ORD001/status \
  -H "Content-Type: application/json" \
  -d '{"status":"servido"}'

# 7. Registrar pago
curl -X POST http://localhost:3000/api/payments \
  -H "Content-Type: application/json" \
  -d '{"reservation_id":"RES001","amount":64000,"method":"tarjeta","status":"aprobado"}'
```

---

## 📋 Reglas de Negocio

### Reservas
- ✅ No se puede crear una reserva sin especificar `clientRef` O `guest` (pero no ambas)
- ✅ El `table_id` debe existir en la base de datos
- ✅ No se permiten reservas con horarios que se superpongan en la misma mesa
- ✅ El estado de la mesa se sincroniza automáticamente con el de la reserva
- ✅ Una reserva solo puede pasar entre estados válidos (confirmada → en_curso → completada)
- ✅ No se puede reservar una mesa con capacidad menor a `peopleCount`

### Órdenes
- ✅ Una orden siempre debe estar asociada a una reserva existente
- ✅ Una orden debe tener al menos 1 item
- ✅ El estado solo puede cambiar siguiendo la secuencia: abierto → enviado_cocina → en_preparacion → listo → servido
- ✅ `totalAmount` y `subtotalAmount` se calculan automáticamente

### Pagos
- ✅ El monto pagado debe ser positivo
- ✅ Si `split` está presente, `part` debe ser ≤ `totalParts`
- ✅ Si `scope` es "order", `order_id` es obligatorio
- ✅ Los métodos válidos son: efectivo, tarjeta, nequi, daviplata

### Descuentos/Cupones
- ✅ Un código de cupón debe ser único
- ✅ La fecha actual debe estar entre `validFrom` y `validUntil`
- ✅ El contador `usedCount` no puede exceder `maxUses`
- ✅ Un descuento solo se aplica a una reserva si está activo (`active: true`)

### Productos
- ✅ Las categorías válidas son: "bebida", "comida", "otro"
- ✅ Las subcategorías dependen de la categoría
- ✅ El precio base debe ser ≥ 0
- ✅ Un producto inactivo no se puede vender

### Clientes
- ✅ El `docID` es único en el sistema
- ✅ El email debe tener formato válido (opcional)
- ✅ El teléfono mínimo 7 dígitos
- ✅ El nombre debe tener mínimo 3 caracteres

---

## ❌ Manejo de Errores

### Estructura de Error Estándar

```json
{
  "message": "Descripción del error",
  "field": "nombre_del_campo",
  "errors": [
    {
      "field": "email",
      "message": "Email inválido"
    }
  ]
}
```

### Códigos HTTP

| Código | Significado | Ejemplo |
|--------|-----------|---------|
| **200** | OK | Consulta exitosa |
| **201** | Created | Recurso creado |
| **400** | Bad Request | Datos incompletos o inválidos |
| **404** | Not Found | Recurso no existe |
| **409** | Conflict | Valor duplicado (docID, código, etc.) |
| **422** | Unprocessable Entity | Validación fallida |
| **500** | Server Error | Error interno del servidor |

---

## 🔧 Desarrollo Local

### Iniciar el Servidor

```bash
# Modo desarrollo (con auto-reload)
npm run dev

# Output esperado:
# ✅ Database connected successfully
# 🚀 Server running at http://localhost:3000
# 📍 Environment: development
```

### Probar Endpoints

#### Opción 1: cURL
```bash
curl http://localhost:3000/api/clients
```

#### Opción 2: Postman
Importar colección JSON incluida en el proyecto

#### Opción 3: Thunder Client (VS Code)
Instalar extensión y usar

---

## 🚧 Pendientes y Mejoras Futuras

### 🔴 **Crítico**

- [ ] **Autenticación JWT** - Login y roles
- [ ] **Paginación Consistente** - En todos los GET
- [ ] **Búsqueda y Filtrado** - Avanzado
- [ ] **Validaciones Robustas** - Sincronización de estados

### 🟡 **Importante**

- [ ] **Caché con Redis** - Productos frecuentes
- [ ] **Historial de Cambios** - Auditoría completa
- [ ] **WebSockets** - Notificaciones en tiempo real
- [ ] **Reportes en PDF/Excel** - Exportación de datos

### 🟢 **Nice to have**

- [ ] **Integración de Pagos** - Stripe, Paypal
- [ ] **SMS/Email** - Confirmaciones
- [ ] **Mobile App** - Companion para staff
- [ ] **Analytics Dashboard** - KPIs y gráficas

---

## 🐛 Solución de Problemas

### MongoDB connection failed
```bash
# Iniciar MongoDB
mongod
```

### Port 3000 already in use
```bash
# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

### CORS error
```env
# Ajustar en .env
CORS_ORIGIN=http://localhost:5173
```

---

## 📞 Autores

- **Juan Felipe García Vega**
- **Enid Noreña Viramar**

Proyecto académico – Bases de Datos Avanzadas

---

**Última actualización:** 9 de mayo de 2026 | **Versión:** 1.0.0