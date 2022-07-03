//import
require('dotenv').config()

const express = require('express')
const mongoose = require('mongoose')
const  jsonwebtoken = require('jsonwebtoken')
const bcrypt = require('bcrypt')


const app = express()

//config json
app.use(express.json())

//Models
const  User = require('./models/User')

//Rota Pública
app.get('/', (req,res) =>{
    res.status(200).json({msg: "Bem vindo a nossa API"})
} )
//Rota Privada
app.get("/user/:id",checkToken, async(req,res)=> {
    const id = req.params.id

    const user= await User.findById(id, "-password")

    if(!user){
        return res.status(404).json({msg:"usuario não encontrado"})
    }

    res.status(200).json({ user })
} )

function checkToken(req,res,next){
    const authHeader = req.headers['authorization']
    const token = authHeader && authHeader.split("")[1]

    if(!token){
        return res.status(401).json({msg:"Acesso negado"})
    }
}

//Registrar Usuário
app.post('/auth/register', async(req,res) =>{

    const {name, password, confirmpassword} = req.body

    //validações
    if(!name){
        return res.status(422).json({msg:'o nome é obrigatório'})
    }
    if(!password){
        return res.status(422).json({msg:'a senha é obrigatório'})
    }
    if(password !== confirmpassword){
        return res.status(422).json({msg:'As senhas não conferem'})
    }

 // Verificar se o usuario existe
 const userExist = await User.findOne({name :name})
    if(userExist){
        return res.status(422).json({msg:'Favor use outro nome'})
    }

//Criando senha
const salt = await bcrypt.genSalt(12)
const passwordHash = await bcrypt.hash(password, salt)

//Criando Usuário
const user = new User ({
    name, 
    password:passwordHash,
})
    try{
        await user.save()
        res.status(201).json({msg: 'Usuário criado com sucesso'})
    }catch(error){
        console.log(error)
        res.status(500).json({msg:"Erro no servidor"})
    }

} )

//login do Usuário 
app.post("/auth/login", async(req,res)=> {
    const {name,password} = req.body

    if(!name){
        return res.status(422).json({msg:'o nome é obrigatório'})
    }
    if(!password){
        return res.status(422).json({msg:'a senha é obrigatório'})
    }
//verificar se o usuario existe
    const user = await User.findOne({name :name})
    if(!user){
        return res.status(422).json({msg:'Usuario não encontrado'})
    }
//checkar se existe a senha
const checkPassword = await bcrypt.compare(password, user.password)
    if(!checkPassword){
        return res.status(404).json({msg:'Senha invalida'})
    }

    try{
        const secret = process.env.SECRET 
        const token = jwt.sign({
            id:user.id
        },
            secret,    )

        res.status(200).json({msg:"autenticação feita com suceso", token})
    }catch(err){
        console.log(error)
        res.status(500).json({msg:"Erro no servidor"})
    }
   
})
//Credenciais
const dbUser = process.env.DB_USER
const dbPassword = process.env.DB_PASS


mongoose.connect(`mongodb+srv://${dbUser}:${dbPassword}@cluster0.t2vammy.mongodb.net/?retryWrites=true&w=majority`)
.then(()=>{
    app.listen(3000)
    console.log("Conectou ao BD")
}).catch((err) => console.log(err))
