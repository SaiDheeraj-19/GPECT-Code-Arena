"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const adminEmail = process.env.ADMIN_EMAIL || 'founder@codearena.gpcet.ac.in';
        const hashedPassword = yield bcryptjs_1.default.hash('K9#xL3@vQ7!mT2$z', 10);
        const admin = yield prisma.user.upsert({
            where: { email: adminEmail },
            update: {
                password_hash: hashedPassword,
                must_change_password: false,
                role: client_1.Role.ADMIN
            },
            create: {
                email: adminEmail,
                name: 'Arena Admin',
                password_hash: hashedPassword,
                role: client_1.Role.ADMIN,
                must_change_password: false
            },
        });
        console.log("Database seeded successfully with ADMIN user:", admin.email);
    });
}
main()
    .then(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}))
    .catch((e) => __awaiter(void 0, void 0, void 0, function* () {
    console.error(e);
    yield prisma.$disconnect();
    process.exit(1);
}));
