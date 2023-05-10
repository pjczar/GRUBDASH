const { stat } = require("fs");
const path = require("path");

// Use the existing order data
const orders = require(path.resolve("src/data/orders-data"));

// Use this function to assigh ID's when necessary
const nextId = require("../utils/nextId");

// TODO: Implement the /orders handlers needed to make the tests pass
function orderHas(parameter) {
    return function (req, res, next) {
        const { data = {} } = req.body;
        if (data[parameter]) {
            next();
        } else {
            next({status: 400, message: `Order must include a ${parameter}`});
        }
    }
}

function validDishes(req, res, next) {
    const { data: {dishes} } = req.body;
    if (Array.isArray(dishes) && dishes.length > 0) {
        next();
    }
    next({ status: 400, message: `Order must include at least one dish` })
}

function validQuantity(req, res, next) {
    const { data: { dishes } } = req.body;
    const invalid = dishes.find((dish) => dish.quantity <= 0 || !Number.isInteger(dish.quantity));
    if (invalid) {
        const index = dishes.findIndex(dish => dish === invalid)
        next({ status: 400, message: `Dish ${index} must have a quantity that is an integer greater than 0` });
    }
    next();
}

function orderExists(req, res, next) {
    const { orderId } = req.params;
    const foundOrder = orders.find(order => order.id === orderId);
    if (foundOrder) {
        res.locals.order = foundOrder;
        next();
    } else {
        next({ status: 404, message: `Order does not exist ${orderId}.` });
    }
}

function idMatches(req, res, next) {
    const {orderId} = req.params;
    const { data: { id } } = req.body;
    if (!id || id === orderId) {
        next();
    }
    next({status: 400, message: `Order id does not match route id. Dish: ${id}, Route: ${orderId}`});  
}

function validStatus(req, res, next) {
    const { data: { status } } = req.body;
    if (status === "delivered") {
        next({status: 400, message: `A delivered order cannot be changed`});
    } else if (status === "invalid") {
        next({status: 400, message: `Order must have a status of pending, preparing, out-for-delivery, delivered`});
    }
    next();
}

function statusNotPending(req, res, next) {
    const { status } = res.locals.order;
    if (status != "pending") {
        next({status: 400, message: `An order cannot be deleted unless it is pending`});
    }
    next();
}

function list(req, res) {
    res.json({data: orders});
}

function create(req, res) {
    const { data: { deliverTo, mobileNumber, status, dishes } } = req.body;
    const newOrder = {
        id: nextId(),
        deliverTo,
        mobileNumber,
        status,
        dishes
    }
    orders.push(newOrder);
    res.status(201).json({ data: newOrder });
}

function read(req, res) {
    res.json({ data: res.locals.order });
}

function update(req, res) {
    const order = res.locals.order;
    const { data: { deliverTo, mobileNumber, status, dishes } } = req.body;
    order.deliverTo = deliverTo;
    order.mobileNumber = mobileNumber;
    order.status = status;
    order.dishes = dishes;
    res.json({ data: order });
}

function destroy(req, res) {
    const { orderId } = req.params;
    const index = orders.findIndex(order => order.id === orderId );
    const deletedOrders = orders.splice(index, 1);
    res.sendStatus(204);
}

module.exports = {
    list,
    create: [
        orderHas("deliverTo"),
        orderHas("mobileNumber"),
        orderHas("dishes"),
        validDishes,
        validQuantity,
        create
    ],
    read: [orderExists, read],
    update: [
        orderExists,
        idMatches,
        orderHas("deliverTo"),
        orderHas("status"),
        orderHas("mobileNumber"),
        orderHas("dishes"),
        validDishes,
        validQuantity,
        validStatus,
        update
    ],
    delete: [
        orderExists,
        statusNotPending,
        destroy
    ]
}