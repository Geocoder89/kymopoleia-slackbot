const Slackbot = require('slackbots');
const axios = require('axios');
const dotenv = require('dotenv');
const express = require('express');
require('./db/mongoose');
const app = express();
const bodyParser = require('body-parser');
const passport = require('passport')
const LocalStrategy = require('passport-local').Strategy
const passportLocalMongoose = require('passport-local-mongoose');
const User = require('./models/user');


const port = process.env.PORT 

dotenv.config();



// app and authentication configuration

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({extended: true}));
app.use(require('express-session')({
    secret:"this is the kymopoleia app",
    resave:false,
    saveUninitialized:true
}));
app.use(express.static(__dirname + "/public"))

app.use(passport.initialize());
app.use(passport.session())

// passport configuration

// passport.serializeUser(function(user, done) {
//     done(null, user._id);
// });

// passport.deserializeUser(function(id, done) {
//     User.findById(id, function (err, user) {
//       done(err, user);
//     });
// });

// passport.use(new LocalStrategy(function(username, password, done) {
//     User.findOne({
//         username: username
//     }, function(err, user) {
//         // This is how you handle error
//         if (err) return done(err);
//         // When user is not found
//         if (!user) return done(null, false);
//         // When password is not correct
//         if (!user.authenticate(password)) return done(null, false);
//         // When all things are good, we return the user
//         return done(null, user);
//      });
// }));
 

// passport.use(new LocalStrategy(
//     function(username, password, done) {
//       User.findOne({ username: username }, function (err, user) {
//         if (err) { return done(err); }
//         if (!user) { return done(null, false); }
//         user.comparePassword(password, user.password, function (err, isMatch) {
//           if (err) { return done(err); }
//           if (!isMatch) { return done(null, false); }
//           return done(null, user);
//         });
//       });
//     }
//   ));

// /plugins from passportlocalmongoose in user.js file
passport.use(new LocalStrategy(User.authenticate())); //creating new local strategy with user authenticate from passport-local-mongoose
passport.serializeUser(User.serializeUser()); //responsible for encoding it, serializing data and putting it back into session
passport.deserializeUser(User.deserializeUser()); //responsible for reading session, taking data from session that is encoded and unencoding it

// authentication routes
app.get("/", (req, res) => {
    res.render('index');
})

// this shows the login form
app.get('/login', (req, res) => {
    res.render('login');
})

// this shows the signup form
app.get('/signup', (req, res) => {
    res.render('signup');
});

// this handles the signup logic

app.post('/signup',(req,res)=>{
    req.body.username
    req.body.email
    req.body.password

    User.register(new User({
        username:req.body.username,
        email:req.body.email
    }),req.body.password,function(err,user){
        if(err){
            console.log(err)
            return res.render('signup');
        
        }
        passport.authenticate('local')(req,res,function(){
            res.redirect('https://app.slack.com/client/TNNH51BC5/CNNH51UDT/')
        })
    })
})
app.post('/login', 
  passport.authenticate('local', { failureRedirect: '/login' }),
  function(req, res) {
    res.redirect('https://app.slack.com/client/TNNH51BC5/CNNH51UDT/');
  });


app.listen(port, () => {
    console.log('Server is up on port ' + port);
});



// bot interaction configuration
const bot = new Slackbot({
    token: `${process.env.BOT_TOKEN}`,
    name: 'slack-chatbot'
})

bot.on('start', () => {
    const params = {
        icon_emoji: ':sunglasses:'
    }

    bot.postMessageToChannel(
        'general',
        'Hi,i am slack-chatbot, how may i be of help?',
        params
    );

    // bot.postMessageToUser('Mercy Inyang', 'Hey there,i am slackbot,it is nice to meet you', params)

    bot.postMessageToGroup('random-gist', 'Hello World!', params)

})



// Slackbot error handler

bot.on('error', (err) => {
    console.log(err)
})

// Slackbot Message handler

bot.on('message', (data) => {
    if (data.type !== "message") {
        return;
    }

    // this handles the particular message we want to deliver back

    handleMessage(data.text);
})

// Slackbot response handler

function handleMessage(message) {
    const greeterA = 'Hello'

    if (message.includes(greeterA)) {
        sendGreeting();
    }

    if (message.includes(' note')) {
        notes();
    }
}

//function designed to send a greeting 
function sendGreeting() {
    const greeting = getGreeting();
    bot.postMessageToChannel('random', greeting)



}

function getGreeting() {
    const greetings = [
        'hello',
        'hola,como estas',
        'Good morning house',
        'Greetings from Slackbot',
        'Bonjour,comment ca va?'
    ];

    return greetings[Math.floor(Math.random() * greetings.length)]
}

function notes() {
    axios.get('https://www.slashnotes.com/').then(res => {
        const note = res.data.value.notes;

        const params = {
            icon_emoji: ':laughing:'
        };

        bot.postMessageToChannel('general', `save notes: ${note}`, params);
    });
}
