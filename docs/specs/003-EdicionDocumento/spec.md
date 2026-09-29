# Especificación: Edición del apartado Documento

## Problema

Actualmente, el apartado **Documento** limita el control del usuario sobre dos campos:

- La fecha **Válida hasta** no se puede editar manualmente.
- La **Condición de venta** solo permite elegir opciones predefinidas y no permite escribir un valor personalizado.

## Objetivo

Dar al usuario mayor control sobre el apartado **Documento** mediante los siguientes cambios:

1. Agregar un checkbox que permita activar o desactivar la edición manual de la fecha **Válida hasta**.
2. Permitir que el usuario escriba libremente la **Condición de venta**.

## Requisitos funcionales

### RF-01: Control de la fecha Válida hasta

- El campo **Válida hasta** debe incluir un checkbox para activar o desactivar su edición manual.
- Con el checkbox desactivado, la fecha debe conservar el comportamiento automático actual: fecha de emisión más 15 días.
- Con el checkbox activado, el usuario debe poder seleccionar o escribir una fecha válida en el campo **Válida hasta**.
- Al desactivar nuevamente el checkbox, el campo debe volver al cálculo automático basado en la fecha de emisión.

### RF-02: Condición de venta editable

- **Condición de venta** debe ser un campo de texto editable.
- El usuario debe poder escribir una condición personalizada, sin limitarse a las opciones actuales.
- El valor escrito debe mostrarse en la vista previa y en el documento generado en el lugar donde actualmente aparece la condición de venta.

## Fuera de alcance

- No modificar el diseño ni el formato actual del documento generado.
- No cambiar otros campos o comportamientos fuera del apartado **Documento**.
- No alterar la estructura, los estilos, los márgenes, las tablas ni la distribución del DOCX.
- No realizar mejoras adicionales que no estén descritas en los objetivos de esta especificación.

## Criterios de aceptación

### CA-01: Activar edición de Válida hasta

**Dado** que el checkbox de edición manual está desactivado  
**Cuando** el usuario lo activa  
**Entonces** puede editar la fecha **Válida hasta**.

### CA-02: Mantener el cálculo automático

**Dado** que el checkbox de edición manual está desactivado  
**Cuando** el usuario cambia la fecha de emisión  
**Entonces** la fecha **Válida hasta** se calcula automáticamente como la fecha de emisión más 15 días.

### CA-03: Volver al cálculo automático

**Dado** que el usuario editó manualmente la fecha **Válida hasta**  
**Cuando** desactiva el checkbox  
**Entonces** la fecha vuelve a calcularse automáticamente como la fecha de emisión más 15 días.

### CA-04: Escribir una condición personalizada

**Dado** que el usuario está en el apartado **Documento**  
**Cuando** escribe un valor personalizado en **Condición de venta**  
**Entonces** el sistema conserva y muestra el texto ingresado.

### CA-05: Reflejar la condición en las salidas existentes

**Dado** que el usuario escribió una condición de venta personalizada  
**Cuando** consulta la vista previa o genera el documento  
**Entonces** la condición ingresada aparece en el espacio existente para ese dato, sin alterar el formato del documento.

### CA-06: Control del usuario

**Dado** que el usuario necesita adaptar los datos de una proforma  
**Cuando** utiliza los controles del apartado **Documento**  
**Entonces** puede decidir si la fecha **Válida hasta** se calcula automáticamente o se edita manualmente, y puede escribir la condición de venta que necesite.
