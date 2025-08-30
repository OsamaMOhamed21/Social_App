"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DatabaseRepository = void 0;
class DatabaseRepository {
    model;
    constructor(model) {
        this.model = model;
    }
    async findOne({ filter, select, }) {
        return await this.model.findOne(filter).select(select || "");
    }
    async create({ data, options, }) {
        return await this.model.create(data, options);
    }
}
exports.DatabaseRepository = DatabaseRepository;
