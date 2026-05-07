import { PrismaClient, TipoCategoria, Role } from "@prisma/client";
const prisma = new PrismaClient();

async function main() {
    console.log("Iniciando o seeding...");

    const categoriasIniciacao = ['sub-7', 'sub-8', 'sub-9', 'sub-10'];

    for (const nome of categoriasIniciacao){
        const categoriaExiste = await prisma.categoria.findFirst({ 
            where: { nome: nome } 
        });
        if (!categoriaExiste){
        await prisma.categoria.create({
            data: { 
                nome: nome,
                tipo: TipoCategoria.INICIACAO,
            },
        });
            console.log(`Categoria ${nome} Criada!`);
        } else {
            console.log(`Categoria ${nome} já existe, pulando...`);
        }
    }

    const categoriasBases = ['sub-12', 'sub-14', 'sub-16', 'sub-18'];

    for (const nome of categoriasBases){
        const categoriaExiste = await prisma.categoria.findFirst({ 
            where: { nome:nome } 
        });
        if (!categoriaExiste) {
        await prisma.categoria.create({
            data: {
                nome: nome,
                tipo: TipoCategoria.BASE,
            },
        });
            console.log(`Categoria ${nome} Criada!`);
        } else {
            console.log(`Categoria ${nome} já existe, pulando...`);
        }
    }

    const bcrypt = require('bcrypt');
    const hashSenha = await bcrypt.hash('adm123', 10);

    await prisma.usuario.upsert({
        where: {email: 'adm@adm' },
        update: {},
        create: {
            nome: 'Administrador',
            email: 'adm@adm',
            senha: hashSenha,
            role: Role.ADMIN,
        },
    });

    console.log('Categorias e Admin criados');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    })