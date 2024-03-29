import express from "express";
import { isBuyer } from "../middleware/authentication.middleware.js";
import {
  addProductToCartValidationSchema,
  updateItemQuantitySchema,
} from "./cart.validation.js";
import Product from "../product/product.model.js";
import Cart from "./cart.model.js";
import mongoose from "mongoose";
import { checkMongoIdValidity } from "../utils/check.mongo.id.validity.js";

const router = express.Router();

//add item to cart

router.post(
  "/cart/add/item",
  isBuyer,
  async (req, res, next) => {
    // extract item from req.body
    const cartItem = req.body;

    // validate item
    try {
      const validatedData = await addProductToCartValidationSchema.validate(
        cartItem
      );
      req.body = validatedData;
      next();
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },
  async (req, res) => {
    // extract item from req.body
    const item = req.body;
    // add buyerId in the item
    item.buyerId = req.loggedInUserId;
    // check productId for mongoIdValidity
    const isValidMongoId = mongoose.Types.ObjectId.isValid(item.productId);
    // if not valid mongo id
    if (!isValidMongoId) {
      return res.status(400).send({ message: "Invalid mongo id" });
    }
    // check if product exists
    const product = await Product.findOne({ _id: item.productId });

    // if not product, throw error
    if (!product) {
      return res.status(404).send({ message: "Product does not exist." });
    }
    // ? check for product quantity
    // if (product.quantity < item.orderedQuantity) {
    //   return res
    //  .status(400)
    //  .send({ message: "Not enough product in stock." });
    // }
    // ? add item to cart
    // const newItem = new Product(item);
    // await newItem.save();
    // res.status(201).send(newItem);

    // if quantity not available throw error
    if (item.orderedQuantity > product.quantity) {
      return res.status(422).send({ message: "Product is outnumbered." });
    }

    // check if product is already added for this user
    const cartItem = await Cart.findOne({
      productId: item.productId,
      buyerId: item.buyerId,
    });
    if (cartItem) {
      return res.status(409).send({ message: "Product already in cart." });
    }
    // Create the cart, add item to the cart
    await Cart.create(item);
    // return response
    return res
      .status(201)
      .send({ message: "Item is added to the cart successfully." });
  }
);

// update quantity for the cart items

router.put(
  "/cart/item/update-quantity",
  isBuyer,
  async (req, res, next) => {
    // get update-data from req.body
    const updateData = req.body;
    try {
      const validatedData = await updateItemQuantitySchema.validate(updateData);
      req.body = validatedData;
      next();
    } catch (error) {
      return res.status(400).send(error.message);
    }
  },
  async (req, res) => {
    // extract update data from req.body
    const updateData = req.body;
    // check productId for mongoId validity
    const isValidMongoId = mongoose.Types.ObjectId.isValid(
      updateData.productId
    );
    // if not valid mongo id
    if (!isValidMongoId) {
      return res.status(400).send({ message: "Invalid mongo id" });
    }
    // check/find product using productId
    const product = await Product.findOne({ _id: updateData.productId });

    // if not product, throw error
    if (!product) {
      return res.status(404).send({ message: "Product does not exist." });
    }

    // find cartItem using productId and buyerId
    const cartItem = await Cart.findOne({
      productId: updateData.productId,
      buyerId: req.loggedInUserId,
    });
    if (!cartItem) {
      return res
        .status(409)
        .send({ message: "Please add item to the cart first." });
    }

    // do quantity verification
    const newOrderedQuantity =
      updateData.action === "inc"
        ? cartItem.orderedQuantity + 1
        : cartItem.orderedQuantity - 1;

    // ? check if new ordered quantity is greater then the product quantity
    //   if (newOrderedQuantity > product.quantity) {
    //     return res.status(422).send({ message: "Product is outnumbered." });
    //   }
    // update quantity
    //   cartItem.orderedQuantity = newOrderedQuantity;
    //   await cartItem.save();
    // return response
    //   return res
    //  .status(200)
    //  .send({ message: "Item quantity updated successfully." });
    if (newOrderedQuantity > product.quantity) {
      return res.status(422).send({ message: "Product is outnumbered." });
    }
    // make sure the newOrderedQuantity is at least one
    if (newOrderedQuantity < 1) {
      return res
        .status(422)
        .send({ message: "Product count should at least be 1" });
    }
    // update Quantity
    await Cart.updateOne(
      { productId: updateData.productId, buyerId: req.loggedInUserId },
      {
        $set: {
          orderedQuantity: newOrderedQuantity,
        },
      }
    );
    // send response
    return res.status(200).send({ message: "Quantity is updated" });
  }
);

// remove item from cart

router.delete(
  "/cart/remove/:id",
  isBuyer,
  checkMongoIdValidity,
  async (req, res) => {
    // extract cart Id from req.params
    const cartId = req.params.id;

    // delete that product from cart
    await Cart.deleteOne({ _id: cartId, buyerId: req.loggedInUserId });

    // send response

    return res
      .status(200)
      .send({ message: "Item is removed from cart successfully." });
  }
);

// flush cart

router.delete("/cart/flush", isBuyer, async (req, res) => {
  // delete all items from cart
  await Cart.deleteMany({ buyerId: req.loggedInUserId });

  // send response
  return res.status(200).send({ message: "Cart is flushed successfully." });
});

// list items from cart

router.get("/cart/item/list", isBuyer, async (req, res) => {
  const cartItems = await Cart.aggregate([
    {
      $match: {
        buyerId: req.loggedInUserId,
      },
    },
    {
      $lookup: {
        from: "products",
        localField: "productId",
        foreignField: "_id",
        as: "productData",
      },
    },
    {
      $project: {
        orderedQuantity: 1,
        name: { $first: "$productData.name" },
        brand: { $first: "$productData.brand" },
        category: { $first: "$productData.category" },
        price: { $first: "$productData.price" },
        image: { $first: "$productData.image" },
        productId: 1,
      },
    },
  ]);

  let subTotal = 0;

  cartItems.forEach((item) => {
    subTotal += item.price * item.orderedQuantity;
  });

  const discount = (5 / 100) * subTotal;

  const grandTotal = subTotal - discount;

  return res.status(200).send({
    message: "success",
    cartData: cartItems,
    orderSummary: { subTotal, grandTotal, discount },
  });
});

// cart items count

router.get("/cart/item/count", isBuyer, async (req, res) => {
  const buyerId = req.loggedInUserId;
  const cartCount = await Cart.find({ buyerId: buyerId }).count();
  return res.status(200).send({ message: "success", cartItemCount: cartCount });
});

export default router;
