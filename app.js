//
const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const _ = require("lodash");
const app = express();

app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));
app.use(express.static("public"));

mongoose.connect("mongodb+srv://marwan-admin:MarwanClusterPass@firstcluster.hb6r8.mongodb.net/todoListDB?retryWrites=true&w=majority", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const itemSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true
  }
});
const Item = mongoose.model("Item", itemSchema);

const item1 = new Item({
  name: "Go to The Gym"
});
const item2 = new Item({
  name: "Back From The Gym! LOL"
});
const item3 = new Item({
  name: "Self Learning"
});
const defaultItems = [item1, item2, item3];

const listSchema = new mongoose.Schema({
  name: String,
  items: [itemSchema]
});

const List = mongoose.model("List", listSchema);

app.get("/", function(req, res) {

  Item.find(function(err, itemsFound) {
    if (err) {
      console.log("There was an error" + err);
    }

    if (itemsFound.length === 0) {
      Item.insertMany(defaultItems, function(err) {
        if (err) {
          console.log("error is: " + err);
        } else {
          console.log("suscessfully added to the DB! \n");
        }
      });
      res.redirect("/");
    } else {
      res.render("list", {
        listTitle: "Today",
        newListItems: itemsFound
      });
    }
  });
});

app.get("/:subListName", function(req, res) {
  const subListName = _.capitalize(req.params.subListName);

  List.findOne({
    name: subListName
  }, function(err, listFound) {
    if (!err) {
      if (!listFound) {
        //create a new list
        const list = new List({
          name: subListName,
          items: defaultItems
        });
        list.save();
        res.redirect("/" + subListName);
      } else {
        //show existing list
        res.render("list", {
          listTitle: listFound.name,
          newListItems: listFound.items
        });
      }
    } else {
      console.log(err);
    }
  });

});

app.post("/", function(req, res) {

  const itemName = req.body.newIteam;
  const listName = req.body.list

  const item = new Item({
    name: itemName
  });

  if (listName === "Today") {
    item.save();
    res.redirect("/");
  } else {
    List.findOne({
      name: listName
    }, function(err, listFound) {
      listFound.items.push(item);
      listFound.save();
      res.redirect("/" + listName);
    });
  }
});

app.post("/delete", function(req, res) {

  const checkedItemID = req.body.checkBox;
  const listName = req.body.listName;

  if (listName === "Today") {
    Item.findByIdAndRemove(checkedItemID, function(err) {
      if (err) {
        console.log("An error accord when try to use findByIdAndRemove fun", err);
      }
    });
    res.redirect("/");
  } else {
    List.findOneAndUpdate({
      name: listName
    }, {$pull: {items: {_id: checkedItemID}}, useFindAndModify: false}, function(err, listFound) {
      if(!err){
        res.redirect("/" + listName);
      }
    });
  }

});


app.get("/about", function(req, res) {
  res.render("about");
});



let port = process.env.PORT;
if(port == null || port == ""){
  port = 3000;
}

app.listen(port, function() {
  console.log("server is running...");
});
