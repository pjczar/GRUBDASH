const path = require("path");
const { json } = require("express");

const dishes = require(path.resolve("src/data/dishes-data"));

const nextId = require("../utils/nextId");

function dishHas(parameter) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[parameter]) {
            next();
        } else {
            next({status: 400, message: `Dish must include a ${parameter}`});
        }
    }
}

function validPrice(req, res, next) {
    const { data: { price }} = req.body;
    if (Number.isInteger(price) && price > 0) {
        next();
    } else {
        next({ status: 400, message: "Dish must have a price that is an integer greater than 0" });
    }
}

function dishExists(req, res, next) {
    const { dishId } = req.params;
    const foundDish = dishes.find((dish) =>  dish.id === dishId);
    if (foundDish) {
        res.locals.dish = foundDish;
        next();
    } else {
        next({status: 404, message: `Dish does not exist ${dishId}.`});
    }
}

function idMatches(req, res, next) {
    const {dishId} = req.params;
    const { data: { id } } = req.body;
    if (!id || id === dishId) {
        next();
    }
    next({status: 400, message: `Dish id does not match route id. Dish: ${id}, Route: ${dishId}`});  
}

function list(req, res) {
    res.json({data: dishes});
}

function create(req, res) {
    const { data: { name, description, price, image_url } } = req.body;
    const newDish = {
        id: nextId(),
        name,
        description,
        price,
        image_url
    }
    dishes.push(newDish);
    res.status(201).json({data: newDish});
}

function read(req, res) {
    res.json({ data: res.locals.dish });
}

function update(req, res) {
    const dish = res.locals.dish;
    const { data: { name, description, price, image_url } } = req.body;
    dish.name = name;
    dish.description = description;
    dish.price = price;
    dish.image_url = image_url;
    res.json({ data: dish });
}

module.exports = {
    list,
    create: [
        dishHas("name"),
        dishHas("description"),
        dishHas("price"),
        dishHas("image_url"),
        validPrice,
        create
    ],
    read: [
        dishExists, read
    ],
    update: [
        dishExists,
        idMatches,
        dishHas("name"),
        dishHas("description"),
        dishHas("price"),
        dishHas("image_url"),
        validPrice,
        update
    ]
}