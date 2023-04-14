const mongoose = require('mongoose');
const express = require('express');
const { MONGO_CONN_STRING, SERVER_PORT } = require('./settings')
var cors = require('cors')

const app = express();
app.use(cors())
console.log(MONGO_CONN_STRING)

mongoose.connect(uri=MONGO_CONN_STRING)

app.get('/search/food', async (req, res) => {
    try {
        var { name } = req.query
        const collection = mongoose.connection.db.collection('food')
        const cursor = collection.find({ description: { $regex: name, $options: 'i' } })
        const data = await cursor.toArray()

        const validElements = []
        for (let i = 0; i < data.length; i++) {
            let nutrient_conversion_factor = await mongoose.connection.db
                .collection("food_nutrient_conversion_factor")
                .find({ 'fdc_id': data[i]["fdc_id"] })
                .toArray();

            if (Boolean(nutrient_conversion_factor.length)) {
                validElements.push(data[i])
            }
        }

        res.json(validElements);

    } catch (err) {
        console.error(`Error retrieving data: ${err.message}`);
        res.status(500).send('Internal server error');
    }
});

app.get('/search/food/fdc_id', async (req, res) => {
    try {
        var { fdc_id } = req.query
        const db = mongoose.connection
        const collection = db.collection('food')
        const cursor = collection.find({ 'fdc_id': fdc_id })
        const data = await cursor.toArray()
        const row = data[0]

        let portions = await db
            .collection("food_portion")
            .find({ 'fdc_id': row["fdc_id"] }).toArray();

        let nutrient_conversion_factor = await db
            .collection("food_nutrient_conversion_factor")
            .find({ 'fdc_id': row["fdc_id"] }).toArray();

        let nutrient_list_ = await db
            .collection("nutrition")
            .find({ 'fdc_id': row["fdc_id"] }).toArray();

        let nutrient_list = []
        for (let index = 0; index < nutrient_list_.length; index++) {
            const element = nutrient_list_[index];
            const nutrient_id = element.nutrient_id

            let foundNutrient = await db
                .collection("nutrient")
                .find({ 'id': nutrient_id }).toArray();
            nutrient_list.push(foundNutrient)
        }

        let calorie_stats = await db
            .collection("food_calorie_conversion_factor")
            .find({
                'food_nutrient_conversion_factor_id': nutrient_conversion_factor[0]
                    ? nutrient_conversion_factor[0]['id']
                    : null
            }).toArray()


        var results = {};
        results[row['description']] = {
            name: row['description'],
            calorie_stats,
            portions,
            nutrient_list,
        };
        res.json(results);
    } catch (err) {
        console.error(`Error retrieving data: ${err.message}`);
        res.status(500).send('Internal server error');
    }
});

app.get('/food/categories', async (req, res) => {
    try {
        var { key, value } = req.query
        const collection = mongoose.connection.db.collection('food_category');
        const cursor = collection.find({});
        const data = await cursor.toArray()
        res.json(data);
    } catch (err) {
        console.error(`Error retrieving data: ${err.message}`);
        res.status(500).send('Internal server error');
    }
});

app.listen(SERVER_PORT, () => {
    console.log('Server listening on port 13004 !');
});
