const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const moment = require("moment");
const bodyParser = require("body-parser");
const vader = require("vader-sentiment");
const { transformations } = require("./transformations");
const { countPostsByDate, MissingParameterError } = require("./utils");
const { preprocess } = require("./preprocessingService");
const axios = require("axios");
const { TRANSFORMATIONS } = require("./preprocessingService/constants");
const {
  tokenize,
  textVectorizer,
} = require("./preprocessingService/vectorize");

const app = express();

app.use(bodyParser.json());

app.use(
  cors({
    origin: "http://localhost:3001",
    methods: ["GET", "POST", "PUT"],
    allowedHeaders: ["Content-Type"],
  })
);

const intialDbConnection = async () => {
  try {
    await mongoose.connect(
      "mongodb://127.0.0.1:27017/nlp-based-sentiment-analysis",
      {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      }
    );
  } catch (error) {
    console.error(error);
  }
};

intialDbConnection().then(() => console.log("Connected to MongoDB"));

const rowSchema = new mongoose.Schema({
  date: Date,
  content: String,
  compound: Number,
  neg: Number,
  neu: Number,
  pos: Number,
});

const rowBitcoinPriceSchema = new mongoose.Schema({
  timeOpen: String,
  timeClose: String,
  timeHigh: String,
  timeLow: String,
  quote: {
    open: Number,
    high: Number,
    low: Number,
    close: Number,
    volume: Number,
    marketCap: Number,
    timestamp: String,
  },
});

const rowAmazonPriceSchema = new mongoose.Schema({
  Date: String,
  Open: String,
  High: String,
  Low: String,
  Close: String,
  "Adj Close": String,
  Volume: String,
});

const rowOtherPriceSchema = new mongoose.Schema({
  Date: String,
  "Close/Last": String,
  Volume: String,
  Open: String,
  High: String,
  Low: String,
});

const rowSettingsSchema = new mongoose.Schema({
  featureType: String,
  labelType: String,
  testFraction: Number,
  scaleType: String,
  pickColumns: Array,
  windowSize: Number,
  horizonSize: Number,
  postsPerDay: Number,
  checkboxes: Object,
  averageSentenceLength: Number,
  postsByRandom: Boolean,
  removeNullValues: Boolean,
  scaleColumnsSeparately: Boolean,
  name: String,
});

const rowDatasetSchema = new mongoose.Schema({
  data: Array,
  name: String,
});

const BitcoinCollection = mongoose.model(
  "bitcoin-01-01-2015-01-01-2023",
  rowSchema
);

const BitcoinPriceCollection = mongoose.model(
  "bitcoin-price-14-07-2010-05-07-2023",
  rowBitcoinPriceSchema
);

const AmazonPriceCollection = mongoose.model(
  "amazon-price-07-07-2013-06-07-2023",
  rowAmazonPriceSchema
);

const ApplePriceCollection = mongoose.model(
  "apple-price-07-07-2013-06-07-2023",
  rowOtherPriceSchema
);

const GooglePriceCollection = mongoose.model(
  "google-price-07-07-2013-06-07-2023",
  rowOtherPriceSchema
);

const MicrosoftPriceCollection = mongoose.model(
  "microsoft-price-07-07-2013-06-07-2023",
  rowOtherPriceSchema
);

const TeslaPriceCollection = mongoose.model(
  "tesla-price-07-07-2013-06-07-2023",
  rowOtherPriceSchema
);

const InvestingFullCollection = mongoose.model(
  "investment-01-01-2015-01-06-2023",
  rowSchema
);

const InvestingLiteCollection = mongoose.model(
  "investing-100-01-01-2015-01-06-2023",
  rowSchema
);

const RowSettings = mongoose.model("row-settings", rowSettingsSchema);

const Datasets = mongoose.model("datasets", rowDatasetSchema);

const BITCOIN_VALUE = "bitcoin";
const APPLE_VALUE = "apple";
const GOOGLE_VALUE = "google";
const MICROSOFT_VALUE = "microsoft";
const TESLA_VALUE = "tesla";
const AMAZON_VALUE = "amazon";
const INVESTING_FULL_VALUE = "investingFull";
const INVESTING_LITE_VALUE = "investingLite";

const dbFeatureModels = {
  [BITCOIN_VALUE]: BitcoinCollection,
  [INVESTING_LITE_VALUE]: InvestingLiteCollection,
  [INVESTING_FULL_VALUE]: InvestingFullCollection,
};

const dbLabelModels = {
  [BITCOIN_VALUE]: BitcoinPriceCollection,
  [APPLE_VALUE]: ApplePriceCollection,
  [GOOGLE_VALUE]: GooglePriceCollection,
  [MICROSOFT_VALUE]: MicrosoftPriceCollection,
  [TESLA_VALUE]: TeslaPriceCollection,
  [AMAZON_VALUE]: AmazonPriceCollection,
};

app.get("/api/bitcoin", async (req, res) => {
  try {
    res.json(await BitcoinCollection.find());
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.get("/api/bitcoin/price", async (req, res) => {
  try {
    const startDate = new Date("2015-01-01").toISOString();
    const endDate = new Date("2022-12-31").toISOString();
    const price = await BitcoinPriceCollection.find({
      timeOpen: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ _id: -1 });
    res.json(
      price.map((e) => ({
        date: new Date(e.timeOpen).toISOString(),
        open: e.quote.open,
        close: e.quote.close,
        low: e.quote.low,
        high: e.quote.high,
        volume: e.quote.volume,
      }))
    );
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.get("/api/apple/price", async (req, res) => {
  try {
    const startDate = new Date("2014-12-30").toISOString();
    const endDate = new Date("2022-12-31").toISOString();
    const price = await ApplePriceCollection.find({
      Date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ _id: -1 });
    res.json(
      price.map((e) => ({
        date: moment(e.Date).add(1, "hour").toISOString(),
        open: e.Open.replace("$", ""),
        close: e["Close/Last"].replace("$", ""),
        low: e.Low.replace("$", ""),
        high: e.High.replace("$", ""),
        volume: e.Volume.replace("$", ""),
      }))
    );
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.get("/api/google/price", async (req, res) => {
  try {
    const startDate = new Date("2014-12-30").toISOString();
    const endDate = new Date("2022-12-31").toISOString();
    const price = await GooglePriceCollection.find({
      Date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ _id: -1 });
    res.json(
      price.map((e) => ({
        date: moment(e.Date).add(1, "hour").toISOString(),
        open: e.Open.replace("$", ""),
        close: e["Close/Last"].replace("$", ""),
        low: e.Low.replace("$", ""),
        high: e.High.replace("$", ""),
        volume: e.Volume.replace("$", ""),
      }))
    );
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.get("/api/microsoft/price", async (req, res) => {
  try {
    const startDate = new Date("2014-12-30").toISOString();
    const endDate = new Date("2022-12-31").toISOString();
    const price = await MicrosoftPriceCollection.find({
      Date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ _id: -1 });
    res.json(
      price.map((e) => ({
        date: moment(e.Date).add(1, "hour").toISOString(),
        open: e.Open.replace("$", ""),
        close: e["Close/Last"].replace("$", ""),
        low: e.Low.replace("$", ""),
        high: e.High.replace("$", ""),
        volume: e.Volume.replace("$", ""),
      }))
    );
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.get("/api/tesla/price", async (req, res) => {
  try {
    const startDate = new Date("2014-12-30").toISOString();
    const endDate = new Date("2022-12-31").toISOString();
    const price = await TeslaPriceCollection.find({
      Date: {
        $gte: startDate,
        $lte: endDate,
      },
    }).sort({ _id: -1 });
    res.json(
      price.map((e) => ({
        date: moment(e.Date).add(1, "hour").toISOString(),
        open: e.Open.replace("$", ""),
        close: e["Close/Last"].replace("$", ""),
        low: e.Low.replace("$", ""),
        high: e.High.replace("$", ""),
        volume: e.Volume.replace("$", ""),
      }))
    );
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.get("/api/amazon/price", async (req, res) => {
  try {
    const startDate = new Date("2014-12-30").toISOString();
    const endDate = new Date("2023-01-01").toISOString();
    const price = await AmazonPriceCollection.find({
      Date: {
        $gte: startDate,
        $lte: endDate,
      },
    });
    res.json(
      price.map((e) => ({
        date: new Date(e.Date).toISOString(),
        open: e.Open,
        close: e.Close,
        low: e.Low,
        high: e.High,
        volume: e.Volume,
      }))
    );
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.get("/api/bitcoin/postsPerDay", async (req, res) => {
  try {
    const posts = await BitcoinCollection.find();
    const postsPerDay = countPostsByDate(posts);
    res.json({
      postsPerDay,
      minPosts: Math.min(...postsPerDay.map((e) => e.count)),
      maxPosts: Math.max(...postsPerDay.map((e) => e.count)),
    });
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.get("/api/investingFull", async (req, res) => {
  try {
    res.json(await InvestingFullCollection.find());
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.get("/api/investingFull/postsPerDay", async (req, res) => {
  try {
    const posts = await InvestingFullCollection.find();
    const postsPerDay = countPostsByDate(posts);
    res.json({
      postsPerDay,
      minPosts: Math.min(...postsPerDay.map((e) => e.count)),
      maxPosts: Math.max(...postsPerDay.map((e) => e.count)),
    });
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.get("/api/investingLite", async (req, res) => {
  try {
    res.json(await InvestingLiteCollection.find());
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.get("/api/investingLite/postsPerDay", async (req, res) => {
  try {
    const posts = await InvestingLiteCollection.find();
    const postsPerDay = countPostsByDate(posts);
    res.json({
      postsPerDay,
      minPosts: Math.min(...postsPerDay.map((e) => e.count)),
      maxPosts: Math.max(...postsPerDay.map((e) => e.count)),
    });
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.put("/api/bitcoin", async (req, res) => {
  const checkboxes = req.body;
  try {
    const transformed = [];
    const bitcoinData = await BitcoinCollection.find();
    const bulkOperations = bitcoinData.map((e) => {
      const transformedText = transformations(e.content, checkboxes);
      const sentiment =
        vader.SentimentIntensityAnalyzer.polarity_scores(transformedText);
      transformed.push({
        ...e,
        neg: sentiment.neg,
        neu: sentiment.neu,
        pos: sentiment.pos,
        compound: sentiment.compound,
      });
      return {
        updateOne: {
          filter: { _id: e._id },
          update: {
            $set: {
              neg: sentiment.neg,
              neu: sentiment.neu,
              pos: sentiment.pos,
              compound: sentiment.compound,
            },
          },
        },
      };
    });
    res.json(transformed);
    BitcoinCollection.bulkWrite(bulkOperations);
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.put("/api/investingFull", async (req, res) => {
  const checkboxes = req.body;
  try {
    const transformed = [];
    const bitcoinData = await InvestingFullCollection.find();
    const bulkOperations = bitcoinData.map((e) => {
      const transformedText = transformations(e.content, checkboxes);
      const sentiment =
        vader.SentimentIntensityAnalyzer.polarity_scores(transformedText);
      transformed.push({
        neg: sentiment.neg,
        neu: sentiment.neu,
        pos: sentiment.pos,
        compound: sentiment.compound,
      });
      return {
        updateOne: {
          filter: { _id: e._id },
          update: {
            $set: {
              neg: sentiment.neg,
              neu: sentiment.neu,
              pos: sentiment.pos,
              compound: sentiment.compound,
            },
          },
        },
      };
    });
    res.json(transformed);
    InvestingFullCollection.bulkWrite(bulkOperations);
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.put("/api/investingLite", async (req, res) => {
  const checkboxes = req.body;
  try {
    const transformed = [];
    const bitcoinData = await InvestingLiteCollection.find();
    const bulkOperations = bitcoinData.map((e) => {
      const transformedText = transformations(e.content, checkboxes);
      const sentiment =
        vader.SentimentIntensityAnalyzer.polarity_scores(transformedText);
      transformed.push({
        ...e,
        neg: sentiment.neg,
        neu: sentiment.neu,
        pos: sentiment.pos,
        compound: sentiment.compound,
      });
      return {
        updateOne: {
          filter: { _id: e._id },
          update: {
            $set: {
              neg: sentiment.neg,
              neu: sentiment.neu,
              pos: sentiment.pos,
              compound: sentiment.compound,
            },
          },
        },
      };
    });
    res.json(transformed);
    InvestingLiteCollection.bulkWrite(bulkOperations);
  } catch (ex) {
    res.status(500).send("Error fetching data");
    console.error("Error fetching data: ", ex);
  }
});

app.post("/api/preprocessData", async (req, res) => {
  const start = Date.now();
  const body = req.body;
  try {
    if (!body.featureType) {
      throw new MissingParameterError("Feature type");
    }
    if (!body.labelType) {
      throw new MissingParameterError("Label type");
    }
    if (!body.pickColumns || !body.pickColumns.length) {
      throw new MissingParameterError("Pick columns");
    }
    //In progress
    if (body.pickColumns.find((e) => e === "content")) {
      body.pickColumns = body.pickColumns.filter((e) => e !== "content");
      console.error("Content value is in progress, can't set now");
    }
    if (!body.postsPerDay) {
      throw new MissingParameterError("Posts per day");
    }
  } catch (ex) {
    if (ex instanceof MissingParameterError) {
      console.log(ex.message);
      res.status(400).send({
        message: ex.message,
      });
    } else {
      res.status(500).send({
        message: "Internal Server Error!",
      });
    }
  }
  try {
    const startDate = new Date("2015-01-01").toISOString();
    const endDate = new Date("2022-12-31").toISOString();
    const query = [
      {
        $match: {},
      },
      {
        $lookup: {
          from: dbFeatureModels[body.featureType].modelName,
          let: {
            formattedTimeOpen: {
              $substr: [
                body.labelType === BITCOIN_VALUE ? "$timeOpen" : "$Date",
                0,
                10,
              ],
            },
          },
          pipeline: [
            {
              $match: {
                $expr: {
                  $eq: [
                    { $dateToString: { format: "%Y-%m-%d", date: "$date" } },
                    "$$formattedTimeOpen",
                  ],
                },
              },
            },
          ],
          as: "posts",
        },
      },
      {
        $project: {
          posts: 1,
        },
      },
    ];

    if (body.labelType === BITCOIN_VALUE) {
      query[0].$match = {
        timeOpen: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    } else {
      query[0].$match = {
        Date: {
          $gte: startDate,
          $lte: endDate,
        },
      };
    }

    if (body.postsByRandom) {
      query[1].$lookup.pipeline.push({
        $sample: { size: body.postsPerDay },
      });
    } else {
      query[1].$lookup.pipeline.push({ $limit: body.postsPerDay });
    }

    if (body.labelType === BITCOIN_VALUE) {
      query[2].$project = {
        ...query[2].$project,
        timeOpen: 1,
        timeClose: 1,
        timeHigh: 1,
        timeLow: 1,
        "quote.open": 1,
        "quote.high": 1,
        "quote.low": 1,
        "quote.close": 1,
        "quote.volume": 1,
        "quote.marketCap": 1,
      };
    } else if (body.labelType === AMAZON_VALUE) {
      query[2].$project = {
        ...query[2].$project,
        Date: 1,
        Open: 1,
        High: 1,
        Low: 1,
        Close: 1,
        "Adj Close": 1,
        Volume: 1,
      };
    } else {
      query[2].$project = {
        ...query[2].$project,
        Date: 1,
        "Close/Last": 1,
        Volume: 1,
        Open: 1,
        High: 1,
        Low: 1,
      };
    }

    const result = await dbLabelModels[body.labelType].aggregate(query);

    const getLabelName = () => {
      if (body.labelType === BITCOIN_VALUE) {
        return "quote.close";
      } else if (body.labelType === AMAZON_VALUE) {
        return "Close";
      } else {
        return "Close/Last";
      }
    };

    const applyTransformations = (text) => {
      let content = typeof text === "string" ? text : String(text);
      if (body.checkboxes[TRANSFORMATIONS.REMOVE_USERNAMES]) {
        content = content.replace(/@\S+/g, "").replace(/\s\s+/g, "");
      }
      if (body.checkboxes[TRANSFORMATIONS.REMOVE_URLS]) {
        content = content.replace(/http\S+/g, "").replace(/\s\s+/g, "");
      }
      if (body.checkboxes[TRANSFORMATIONS.REMOVE_PUNCTUATION_MARKS]) {
        content = content
          .replace(/(?<!\d)\.(?!\d)|[^\w\s.']/g, " ")
          .replace(/'/g, "")
          .replace(/\s\s+/g, " ");
      }
      if (body.checkboxes[TRANSFORMATIONS.TEXT_TO_LOWERCASE]) {
        content = content.toLowerCase();
      }
      if (body.checkboxes[TRANSFORMATIONS.REMOVE_SHORT_WORDS]) {
        content = content
          .split(" ")
          .filter((e) => e.length > 2)
          .join(" ");
      }
      return content
        .split(" ")
        .filter((e) => e.length !== 0)
        .join(" ")
        .trim();
    };

    const withTransformations = result.map((e) => {
      return {
        ...e,
        posts: e.posts.map((f) => ({
          ...f,
          content: applyTransformations(f.content),
        })),
      };
    });

    const tokenizedDict = tokenize(withTransformations);

    const withVectorization = withTransformations.map((e) => {
      return {
        ...e,
        posts: e.posts.map((f) => ({
          ...f,
          content: textVectorizer(
            tokenizedDict,
            Object.keys(tokenizedDict).length,
            f.content,
            Math.floor(body.averageSentenceLength)
          ),
        })),
      };
    });

    const processed = preprocess({
      mappedRows: withVectorization.reverse(),
      windowSize: body.windowSize,
      horizonSize: body.horizonSize,
      scaleColumnsSeparately: body.scaleColumnsSeparately,
      pickColumns: body.pickColumns,
      scaleType: body.scaleType,
      labelName: getLabelName(),
    });

    const end = Date.now();
    console.log(`Execution time: ${end - start} ms`);
    res.status(200).json(processed);
  } catch (ex) {
    console.log(ex);
  }
});

app.post("/api/settings", async (req, res) => {
  try {
    const body = req.body;
    const foundObject = await RowSettings.findOne(body).exec();
    if (!foundObject) {
      const obj = new RowSettings(body);
      await obj.save();
    }
    res.json(await RowSettings.find());
  } catch (ex) {
    res.status(500).send("Error saving settings");
    console.error("Error saving settings: ", ex);
  }
});

app.get("/api/settings", async (req, res) => {
  try {
    res.json(await RowSettings.find());
  } catch (ex) {
    res.status(500).send("Error loading settings");
    console.error("Error loading settings: ", ex);
  }
});

app.post("/api/dataset", async (req, res) => {
  try {
    const body = req.body;
    const foundObject = await Datasets.findOne(body).exec();
    if (!foundObject) {
      const obj = new Datasets(body);
      await obj.save();
      res.json({
        _id: obj._id,
        name: obj.name,
      });
    }
  } catch (ex) {
    res.status(500).send("Error saving dataset");
    console.error("Error saving dataset: ", ex);
  }
});

app.get("/api/datasetlist", async (req, res) => {
  try {
    res.json((await Datasets.find()).map(({ data, ...rest }) => rest));
  } catch (ex) {
    res.status(500).send("Error loading dataset");
    console.error("Error loading dataset: ", ex);
  }
});

app.get("/api/dataset", async (req, res) => {
  const id = req.params._id;
  const foundObject = await Datasets.findById(id).exec();
  if (!foundObject) {
    res.json(foundObject);
  } else {
    res.json({
      "No datasets found": "No datasets found",
    });
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
});
