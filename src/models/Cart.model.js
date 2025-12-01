import mongoose from 'mongoose';

const cartSchema = new mongoose.Schema({
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true }, // one cart per user
    mahal: { type: mongoose.Schema.Types.ObjectId, ref: 'Mahal', default: null },
    eventDate: { type: Date },
    contractors: [
        {
            contractor: { type: mongoose.Schema.Types.ObjectId, ref: 'Contractor', required: true },
            // optional fields like packageId, quantity can be added later
        }
    ],
    estimatedTotal: { type: Number, default: 0 }
}, { timestamps: true });

// Index for faster user lookups
cartSchema.index({ user: 1 });

// Method to calculate estimated total (placeholder, can be expanded)
cartSchema.methods.calculateTotal = async function () {
    let total = 0;
    if (this.mahal) {
        const Mahal = mongoose.model('Mahal');
        const mahal = await Mahal.findById(this.mahal);
        if (mahal) total += mahal.basePrice;
    }
    // Add contractor prices if needed (requires package info)
    // This is a simplified placeholder.
    this.estimatedTotal = total;
    return total;
};

export default mongoose.model('Cart', cartSchema);
