import { S3 } from "@aws-sdk/client-s3";
import { MongoClient } from "mongodb";
import slugify from "slugify";
import xss from "xss";

const s3 = new S3({
  region: "sa-east-1",
  credentials: {
    accessKeyId: process.env.ACCESS_KEY_ID,
    secretAccessKey: process.env.SECRET_ACCESS_KEY,
  },
});

export async function getMeals() {
  let client;

  try {
    client = await MongoClient.connect(
      `mongodb+srv://${process.env.mongodb_username}:${process.env.mongodb_password}@${process.env.mongodb_clustername}.p1ugi7x.mongodb.net/${process.env.mongodb_database}?retryWrites=true&w=majority`
    );
  } catch (error) {
    console.log("connection to db error!");
  }

  const database = client.db();
  const meals = database.collection("meals");
  const mealsArray = await meals.find().toArray();

  return mealsArray;
}

export async function getMeal(slug) {
  let client;

  try {
    client = await MongoClient.connect(
      `mongodb+srv://${process.env.mongodb_username}:${process.env.mongodb_password}@${process.env.mongodb_clustername}.p1ugi7x.mongodb.net/${process.env.mongodb_database}?retryWrites=true&w=majority`
    );
  } catch (error) {
    console.log("connection to db error!");
  }

  const database = client.db();
  const meals = database.collection("meals");
  const meal = await meals.find({ slug: slug }).next();

  return meal;
}

export async function saveMeal(meal) {
  meal.slug = slugify(meal.title, { lower: true });
  meal.instructions = xss(meal.instructions);

  const extension = meal.image.name.split(".").pop();
  const fileName = `${meal.slug}.${extension}`;

  const bufferedImage = await meal.image.arrayBuffer();

  s3.putObject({
    Bucket: "fabiano-next-js-app-route-course",
    Key: fileName,
    Body: Buffer.from(bufferedImage),
    ContentType: meal.image.type,
  });

  let client;

  try {
    client = await MongoClient.connect(
      `mongodb+srv://${process.env.mongodb_username}:${process.env.mongodb_password}@${process.env.mongodb_clustername}.p1ugi7x.mongodb.net/${process.env.mongodb_database}?retryWrites=true&w=majority`
    );
  } catch (error) {
    console.log("connection to db error!");
  }

  const db = client.db();

  meal.image = fileName;

  try {
    await db.collection("meals").insertOne(meal);
  } catch (error) {
    client.close();
    console.log("insert to db error!");
    return;
  }

  client.close();
}

export const AWS_S3_URL =
  "https://fabiano-next-js-app-route-course.s3.sa-east-1.amazonaws.com";
