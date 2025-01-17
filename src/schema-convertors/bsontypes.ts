// function parseType(type: SchemaType, signal?: AbortSignal): StandardJSONSchema {
// 	switch (type.bsonType) {
// 		case 'Array': return {
// 			type: 'array',
// 			items: parseTypes((type as ArraySchemaType).types)
// 		};
// 		case 'Binary': return {
// 			type: 'string'
// 			// contentEncoding: // TODO: can we get this?
// 		};
// 		case 'Boolean': return {
// 			type: 'boolean'
// 		};
// 		case 'Document': return {
// 			type: 'object',
// 			...parseFields((type as DocumentSchemaType).fields, signal)
// 		};
// 		case 'Double': return {
// 			type: 'number'
// 		};
// 		case 'Null': return {
// 			type: 'null'
// 		};
// 		case 'ObjectId': return {
// 			type: 'string',
// 			contentEncoding: 'base64' // TODO: confirm
// 		};
// 		case 'String': return {
// 			type: 'string'
// 		};
// 		case 'Timestamp': return {
// 			type: 'string'
// 			// TODO
// 		};
// 		default: throw new Error('Type unknown ' + type.bsonType); // TODO: unknown + telemetry?
// 	}
// }