const express = require("express");
const app=express();
const mongoose = require("mongoose");
const Listing = require("./models/listing.js");
const path = require("path");
const methodOverride = require("method-override");
const ejsMate = require("ejs-mate"); 
const wrapAsync = require("./utils/wrapAsync.js");
const ExpressError = require("./utils/ExpressError.js");
const  { listingSchema, reviewSchema } = require("./schema.js");
const session =  require ("express-session"); 
const flash = require("connect-flash");
const password = require("passport");
const localStrategy = require("passport-local");
const User = require("./models/user.js");

const Review = require("./models/review.js");


const MONGO_URL = "mongodb://127.0.0.1:27017/wanderlust";

main()
   .then(() => {
    console.log("connected to DB");
   })
   .catch((err) => {
    console.log(err);
   });
async function main() {
    await mongoose.connect(MONGO_URL);
    
}

app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.urlencoded({extended: true}));
app.use(methodOverride("_method"));
app.engine("ejs" , ejsMate);
app.use(express.static(path.join(__dirname, "/public")));

const sessionOptions = {
    secret: "mysupersecretcode",
    resave: false,
    saveUnintialized: true,
    cookie: {
        expires: Data.now() + 7 * 24 * 60 * 60 *1000,
        maxAge: 7 * 24 * 60 * 60 * 1000,
        httpOnly: true,
    },
};

app.get("/", (req, res) => {
    res.send("Hi, I am root");
});


app.use(session(sessionOptions));
app.use(flash());

app.use(passport.initialize());
app.use(passport.session());
passport.use(new localStrategy(USer.authenticate()));


passport.serializeUser(User.serializeUser());
passport.deserializeUser(USer.deserialieUser());



app.use((req,res,next) => {
    res,locals.success = req.flash("success");
    res,locals.error = req.flash("error");
    
    next();
});


app.get("/demouser" , async ( req, res) => { 
    let fakeUser = new User({
        email:"studentAgmail.com",
        username: "delta-student"
    });
    let registeredUser = await User.register(fakeUser, "helloworld");
    res.send(registeredUser);
});

const validateListing = (req,res,next) => {
    let {error} = listingSchema.validate(req.body);
        
        if(error) {
            let errMsg = error.details.map((el) => el.message).join(",");
            throw new ExpressError(400, errmsg);
        } else {
            next();
        }
};

const validateReview = (req,res,next) => {
    let {error} = reviewSchema.validate(req.body);
        
        if(error) {
            let errMsg = error.details.map((el) => el.message).join(",");
            throw new ExpressError(400, errmsg);
        } else {
            next();
        }
};

//Index Route
app.get("/listings",wrapAsync( async (req, res) => {
    try {
      const allListings = await Listing.find({});
      res.render("listings/index.ejs", { allListings });
    } catch (err) {
      console.error(err);
      res.send("Internal Server Error");
    }
  }));

//new route
app.get("/listings/new",(req,res) => {
    res.render("listings/new.ejs");
});

//show route
app.get("/listings/:id",wrapAsync(async (req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id).populate("reviews");
    if(!listing){
        req.flash("error","listing you requested for does not exist!");
        res.redirect("/listings");
    }
    res.render("listings/show.ejs", { listing });
}));

//create route
app.post("/listings", validateListing,
    wrapAsync(async (req,res,next) => {
        let result = listingSchema.validate(req.body);
        console.log(result);
        if(result.error) {
            throw new ExpressError(400, result.error);
        }
        const newListing = new Listing(req.body.listing);
        await newListing.save();
        req.flash("success", "new listing created!");
        res.redirect("/listings"); 
    })
);

//Edit route
app.get("/listings/:id/edit", wrapAsync(async(req, res) => {
    let {id} = req.params;
    const listing = await Listing.findById(id);
    if(!listing){
        req.flash("error","listing you requested for does not exist!");
        res.redirect("/listings");}
    res.render("listings/edit.ejs", { listing });
}));

//update route
app.put("/listings/:id", 
    validateListing,
    wrapAsync(async (req, res) => {
    let {id} = req.params;
    await Listing.findByIdAndUpdate(id, {...req.body.listing});
    res.redirect(`/listings/${id}`);
}));

//Delete Route
app.delete("/listings/:id", wrapAsync(async (req, res) => {
    let { id } = req.params;
    let deletedListing = await Listing.findByIdAndDelete(id);
    console.log(deletedListing);
    req.flash("success", "new listing deleted!");
    res.redirect("/listings");
  }));

//Reviews
//Post Route
app.post("/listings/:id/reviews",validateReview, 
    wrapAsync(async(req,res) => {
   let listing = await Listing.findById(req.params.id);
   let newReview = new Review(req.body.review);

   listing.reviews.push(newReview);

   await newReview.save();
   await listing.save();

   res.redirect(`/listings/${listing._id}`);
})
);

//Delete Review Route
app.delete("/listings/:id/reviews/:reviewid",
    wrapAsync(async(req,res)=> {
        let { id,reviewId } =req.params;
        await Listing.findByIdAndUpdate(id, {$pull:{reviews: reviewId}});
        await Review.findByIdDelete(reviewId);

        res.redirect('/listings/${id}');
    })
);

// app.get("/testListing", async (req, res) => {
//     let sampleListing = new Listing({ 
//         title: "My New Villa",
//         description:"By the beach",
//         price:1200,
//         location:"Calangute, Goa",
//         country: "India",
//     });
//     await sampleListing.save();
//     console.log("sample was saved");
//     res.send("successful testing");
// }); 

app.all("*", (req,res,next) => {
    next(new ExpressError(404, "Page Not FOund!"));
});

app.use((err,req, res, next) => {
    let {statusCode = 500, message = "Something went wrong!"} = err;
    // res.status(statusCode).send(message);
    res.status(statusCode) .render("error.ejs", {err});
 
}); 
app.listen(8080, () => {
    console.log("server is listening to port 8080");
});