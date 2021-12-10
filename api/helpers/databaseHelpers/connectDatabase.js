const mongoose = require('mongoose');

const connectDatabase = () => {
    mongoose.connect(process.env.MONGO_URI, {useNewUrlParser:true})
    .then(() => {
        console.log("MongoDB Connection Succesful");
    })
    .catch(err => {
        console.error(err);
    })

    //Bağlan. Eğer bir hata olursa -catch-; yoksa -then- 
}

module.exports = connectDatabase;