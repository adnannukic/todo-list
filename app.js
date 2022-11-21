const express = require("express");
const bodyParser = require("body-parser");
const _ = require("lodash");
const mongoose = require("mongoose");

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

MONGOOSE:
mongoose.connect("mongodb+srv://admin-adnan:Test123@cluster0.7v8dkfi.mongodb.net/todolistDB");

const itemsSchema = {
    name: {
        type: String,
        required: [true, "There is no item"]
    }
};

const Item = mongoose.model("Item", itemsSchema);

const item1 = new Item({
    name: "Welcome to your todolist!"
});
const item2 = new Item({
    name: "Hit the + button to add a new item"
});
const item3 = new Item({
    name: "Hit checkbox to delete an item"
});

const defaultItems = [item1, item2, item3];

const listSchema = {
    name: String,
    items: [itemsSchema]
}

const List = mongoose.model("List", listSchema)

// "/" PAGE:

app.get("/", function (req, res) {

    Item.find({}, function (err, items) {
        if (items.length === 0) {
            Item.insertMany(defaultItems, function (err) {
                if (err) {
                    console.log(err);
                } else {
                    console.log("Successfully imported default items");
                }
            });
            res.redirect("/");
        } else {
            res.render("list", { listTitle: "Today", newListItems: items });
        }
    });


});

app.post("/", function (req, res) {
    const item = req.body.listItem;
    const listName = req.body.list.toLowerCase();
    console.log(listName);

    const newItem = new Item({
        name: item
    });


    if(listName === "today") {
        newItem.save(); //Shortcut of Item.insert...
    
        res.redirect("/");
    } else {
        List.findOne({name: listName}, function(err, foundList) {
            foundList.items.push(newItem);
            foundList.save();
            res.redirect("/" + listName);
        });
    }


});

app.post("/delete", function (req, res) {

    const checkedItemId = req.body.checkbox;
    const listName = req.body.listName.toLowerCase(); //listName from the hidden input in list.ejs file 

    if(listName === "today"){
        Item.findByIdAndRemove(checkedItemId, function (err) {
            if (err) {
                console.log(err);
            } else {
                console.log("Successfully deleted checked item");
                res.redirect("/");
            }
        });
    } else {
        List.findOneAndUpdate({name: listName}, {$pull: {items: {_id: checkedItemId}}}, function(err, foundList){
            if(!err) {
                res.redirect("/" + listName);
            }
        });
    }


});


//DYNAMIC PARAMETAR PAGE:

app.get("/:customListName", function (req, res) {

    const customList = _.lowerCase(req.params.customListName);

    List.findOne({ name: customList }, function (err, foundList) {
        if (!err) {
            if (!foundList) {
                const list = new List({
                    name: customList,
                    items: defaultItems
                });
                list.save();
                res.redirect("/" + customList);
            } else {
                res.render("list", { listTitle: foundList.name.charAt(0).toUpperCase() + foundList.name.substr(1), newListItems: foundList.items })
            }
        }

    });

});

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port, function () {
    console.log("Server has started successfully.");
});