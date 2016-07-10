import {Schema, Connection, Document, Model} from 'mongoose';

const schema = new Schema({
	color: { type: String, required: true },
	name: { type: String, required: true },
	user: { type: Schema.Types.ObjectId, required: true, ref: 'User' }
});

export default function(db: Connection): Model<Document> {

	if (!(<any>schema).options.toObject) {
		(<any>schema).options.toObject = {};
	}
	(<any>schema).options.toObject.transform = (doc: any, ret: any) => {
		ret.id = doc.id;
		delete ret._id;
		delete ret.__v;
	};

	return db.model('DriveTag', schema, 'DriveTags');
}
