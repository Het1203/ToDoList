const express = require("express");
const bodyParser = require("body-parser");
const date = require(__dirname + "/date.js");
const mongoose = require("mongoose");
const { name } = require("ejs");
const _ = require("lodash");

const app = express();

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

mongoose.connect("mongodb://127.0.0.1:27017/todolistDB");

const itemsSchema = {
    name: String
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({ name: "This is your To Do List. " });
const item2 = new Item({ name: "Hit the + button to add a new item." });
const item3 = new Item({ name: "Hit the checkbox to delete an item." });

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
};

const List = mongoose.model("List", listSchema);

async function insertDefaultItems() {
    try {
        await Item.insertMany(defaultItems);
        console.log("Successfully saved default items to DB");
    } catch (err) {
        console.log(err);
    }
}


app.get("/", async function (req, res) {
    const day = date.getDate();

    try {
        const foundItems = await Item.find({});
        if (foundItems.length === 0) {
            insertDefaultItems();
            res.redirect("/");
        } else {
            res.render("list", { listTitle: day, newListItems: foundItems });
        }
    } catch (err) {
        console.log(err);
    }
});
app.post("/", async function (req, res) {
    const itemName = req.body.newItem;
    const listName = req.body.list;

    const item = new Item({ name: itemName });

    if (listName === date.getDate()) {
        item.save();
        res.redirect("/");
    } else {
        const foundList = await List.findOne({ name: listName });

        try {
            foundList.items.push(item);
            foundList.save();
            res.redirect("/" + listName);
        } catch (err) {
            console.log(err);
        }
    }
});

app.get("/favicon.ico", (req, res) => res.status(204).end());

app.get("/:customListName", async function (req, res) {
    const customListName = _.capitalize(req.params.customListName);

    try {
        const foundList = await List.findOne({ name: customListName });

        if (!foundList) {
            const list = new List({
                name: customListName,
                items: defaultItems
            });

            list.save();
            res.redirect(`/${customListName}`);
        } else {
            res.render("list", { listTitle: foundList.name, newListItems: foundList.items });
        }
    } catch (err) {
        console.log(err);
    }
});

app.post("/delete", async function (req, res) {
    const checkedItemId = req.body.checkbox.trim();
    const listName = req.body.listName;

    if (listName === date.getDate()) {
        try {
            await Item.findByIdAndDelete(checkedItemId);
            console.log("Successfully deleted item");
            res.redirect("/");
        } catch (err) {
            console.log(err);
        }
    } else {
        const foundList = await List.findOneAndUpdate({ name: listName }, { $pull: { items: { _id: checkedItemId } } });
        try {
            res.redirect("/" + listName);
        } catch (err) {
            console.log(err);
        }
    }
});

app.get("/work", function (req, res) {
    res.render("list", { listTitle: "Work List", newListItems: workItems });
});
app.post("/work", function (req, res) {
    const item = req.body.newItem;

    workItems.push(item);
    res.redirect("/work");
});

app.listen(5000, function () {
    console.log("Server started on port 5000");
});
