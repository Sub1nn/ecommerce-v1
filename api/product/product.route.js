import express from "express";
import { validateReqBody } from "../middleware/validation.middleware.js";
import { productSchema } from "./product.validation.js";
import { isSeller, isUser } from "../middleware/authentication.middleware.js";
import Product from "./product.model.js";
import mongoose from "mongoose";
import { checkMongoIdValidity } from "../utils/check.mongo.id.validity.js";
import { checkProductOwnership } from "../middleware/check.product.ownership.js";

const router = express.Router();

// add product

router.post(
  "/product/add",
  isSeller,
  validateReqBody(productSchema),
  async (req, res) => {
    //    extract new product from req.body
    const newProduct = req.body;

    // we need logged in user id for product owner id
    newProduct.ownerId = req.loggedInUser._id;

    // create product
    await Product.create(newProduct);

    return res.status(200).send({ message: "Product is added successfully." });
  }
);

// get product details

router.get("/product/details/:id", isUser, async (req, res) => {
  // extract id from req.params
  const productId = req.params.id;

  // check for mongo id validity
  const isValidMongoId = mongoose.Types.ObjectId.isValid(productId);

  // if not valid mongo id, throw error
  if (!isValidMongoId) {
    return res.status(400).send({ message: "Invalid mongo id." });
  }

  // find product
  const requiredProduct = await Product.findOne({ _id: productId });

  // if not product, throw error

  if (!requiredProduct) {
    return res.status(404).send({ message: "Product does not exist." });
  }

  //   hide ownerId
  requiredProduct.ownerId = undefined;

  // send product details as response
  return res.status(200).send({ message: "success", product: requiredProduct });
});

// delete product

router.delete(
  "/product/delete/:id",
  isSeller,
  checkMongoIdValidity,
  checkProductOwnership,
  async (req, res) => {
    const { id } = req.params;
    await Product.deleteOne(id);
    return res.status(200).send({ message: "Product is deleted successfully" });
  }
);

// edit a product

router.put(
  "/product/update/:id",
  isSeller,
  checkMongoIdValidity,
  checkProductOwnership,
  async (req, res) => {
    const { id } = req.params;
    const newValues = req.body;
    await Product.updateOne({ _id: id }, { $set: newValues });
    return res.status(200).send({ message: "Product is updated successfully" });
  }
);

export default router;
