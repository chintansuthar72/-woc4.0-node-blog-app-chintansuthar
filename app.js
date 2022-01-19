const express = require('express');
const mongoose = require('mongoose');
const Blog = require('./models/blogModel');
const fs = require('fs');
const multer = require('multer');
const path = require('path');
const dotenv = require('dotenv');
const app = express();

dotenv.config();

const storage = multer.diskStorage({
    destination : (req,file,cb) => {
        cb(null,'public/uploads/');
    },
    filename : (req,file,cb) => {
        const ext = path.extname(file.originalname)
        cb(null,Date.now()+ext);
    }
});

const upload = multer({
    storage : storage,
    fileFilter : (req,file,cb) => {
        if(file.mimetype == "image/jpg" || file.mimetype == "image/png" || file.mimetype == "image/jpeg") {
            cb(null,true);
        } else {
            console.log("Not supported file type.")
            cb("Not supported file type. Please use jpg/jpeg/img.", false);
        }
    }
})

mongoose.connect(process.env.DATABASE_URL)
    .then((result)=>{
        console.log("connected to database...");
        app.listen(7000,'localhost',()=>{
            console.log("listening on port 7000...");
        })
    }) .catch((error)=>{
        console.log(error);
    });

app.use((req,res,next) => {
    res.setHeader("Access-Control-Allow-Origin","*");
    next();
})

app.set('view engine','ejs');
app.set('views','views')
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));

app.get('/', (req,res) => {
    res.redirect('/blogs');
});

app.get('/create', (req,res)=>{
    res.render('create');
})

app.get('/blogs', (req,res) => {
    Blog.find().sort({createdAt : -1}).then((result) => {
        res.render('index',{blogs : result}); 
    }).catch(err => res.send(err));
})

app.post('/blogs', upload.single('image'), (req,res)=>{
    const blog = new Blog({
        title : req.body.title,
        body : req.body.body,
    })
    if(req.file){
        blog.image = req.file.filename
    }
    blog.save().then(result => {
        res.redirect('/blogs');
    }).catch(err => res.send(err));
})

app.get('/blogs/:id', (req,res)=>{
    const id = req.params.id;
    Blog.findById(id).then((result)=>{
        res.render('details',{blog:result});
    }).catch(err => res.send(err));
})

app.delete('/blogs/:id', (req, res) => {
    const id = req.params.id;
    Blog.findByIdAndDelete(id)
    .then(result => {
        res.json({ redirect: '/blogs' });
    })
    .catch(err => {
        res.send(err);
    });
});

app.get('/blogs/update/:id',(req,res)=> {
    const id = req.params.id;
    Blog.findById(id).then(result => {
        res.render('update',{blog:result});
    }).catch(err => res.send(err));
});

app.post('/blogs/update/:id', (req,res) => {
    const id = req.params.id;
    Blog.findByIdAndUpdate(id,req.body).then(result => {
        res.redirect(`/blogs/${id}`)
    }).catch(err => res.send(err));
})

// 404 page
app.use((req,res) => {
    res.status(404).send('Error 404 : resource not found')
})