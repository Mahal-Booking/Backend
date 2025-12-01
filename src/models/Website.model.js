import mongoose from "mongoose";

const websiteSchema = new mongoose.Schema(
    {
        title: String,
        description: String
    },
    {
        collection: "websitedb"    // force collection name
    }
);

export default mongoose.model("Website", websiteSchema);
