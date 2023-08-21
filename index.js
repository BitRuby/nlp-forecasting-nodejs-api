const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const moment = require("moment");
const bodyParser = require("body-parser");
const vader = require("vader-sentiment");
const { transformations } = require("./transformations");
const { countPostsByDate, MissingParameterError } = require("./utils");
const { preprocess } = require("./preprocessingService");
const {
  TRANSFORMATIONS,
  ALGORITHMS,
} = require("./preprocessingService/constants");
const {
  tokenize,
  textVectorizer,
} = require("./preprocessingService/vectorize");
const WebSocket = require("ws");
const http = require("http");
const { predictNaive } = require("./predictionService/predictionNaive");
const { dense1Model } = require("./predictionService/dense1");

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

const connectedSockets = [];

wss.on("connection", (socket) => {
  console.log("Client connected");

  connectedSockets.push(socket);

  socket.on("message", (message) => {
    console.log(`Received: ${message}`);
  });
});

function sendToAllClients(message) {
  connectedSockets.forEach((socket) => {
    socket.send(message);
  });
}

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
  trainElements: Number,
  testElements: Number,
  featureType: String,
  labelType: String,
  windowSize: Number,
  horizonSize: Number,
  pickColumns: Array,
  removeNullValues: Boolean,
  testFraction: Number,
  scaleType: String,
  postsByRandom: Boolean,
  postsPerDay: Number,
  averageSentenceLength: Number,
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

app.get("/api/test2", async (req, res) => {
  const startDate = new Date("2022-11-26").toISOString();
  const endDate = new Date("2022-11-30").toISOString();

  const x = await BitcoinCollection.find({
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  });
  res.status(200).send(x);
});

app.get("/api/test", async (req, res) => {
  try {
    const startDate = new Date("2015-01-01").toISOString();
    const endDate = new Date("2022-12-31").toISOString();
    const query = [
      {
        $match: {
          timeOpen: {
            $gte: startDate,
            $lte: endDate,
          },
        },
      },
      {
        $lookup: {
          from: BitcoinCollection.modelName,
          let: {
            formattedTimeOpen: {
              $substr: ["$timeOpen", 0, 10],
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
            {
              $sample: {
                size: 5,
              },
            },
          ],
          as: "posts",
        },
      },
      {
        $project: {
          posts: 1,
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
        },
      },
    ];
    const result = await BitcoinPriceCollection.aggregate(query);
    res.status(200).send(result);
  } catch (ex) {
    res.status(500).send(ex);
    console.log(ex);
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
    if (!body.name) {
      throw new MissingParameterError("Dataset name");
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
    res.status(200).json({ message: "Preprocessing data started!" });
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
    const endDate = new Date("2021-12-31").toISOString();
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
    const ds = new Datasets({
      data: processed,
      name: body.name,
      trainElements: processed[1].length,
      testElements: processed[3].length,
      featureType: body.featureType,
      labelType: body.labelType,
      windowSize: body.windowSize,
      horizonSize: body.horizonSize,
      pickColumns: body.pickColumns,
      removeNullValues: body.removeNullValues,
      testFraction: body.testFraction,
      scaleType: body.scaleType,
      postsByRandom: body.postsByRandom,
      postsPerDay: body.postsPerDay,
      averageSentenceLength: body.averageSentenceLength,
    });
    await ds.save();
    sendToAllClients(
      `Dataset ${body.name} has been saved after ${end - start} ms!`
    );
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
    res.json(
      (await Datasets.find()).map((e) => ({
        value: e._id,
        label: e.name,
        trainElements: e.trainElements,
        testElements: e.testElements,
        featureType: e.featureType,
        labelType: e.labelType,
        windowSize: e.windowSize,
        horizonSize: e.horizonSize,
        pickColumns: e.pickColumns,
        removeNullValues: e.removeNullValues,
        testFraction: e.testFraction,
        scaleType: e.scaleType,
        postsByRandom: e.postsByRandom,
        postsPerDay: e.postsPerDay,
        averageSentenceLength: e.averageSentenceLength,
      }))
    );
  } catch (ex) {
    res.status(500).send("Error loading dataset");
    console.error("Error loading dataset: ", ex);
  }
});

app.post("/api/train", async (req, res) => {
  try {
    const body = req.body;
    if (!body.datasetId) {
      throw new MissingParameterError("Dataset id");
    }
    if (!body.algorithm) {
      throw new MissingParameterError("Algorithm");
    }
    const ds = await Datasets.findById(body.datasetId);
    if (!ds) {
      throw new Error("Dataset not found!");
    }
    if (body.algorithm === ALGORITHMS.NAIVE) {
      const predictionResult = await predictNaive(ds.data[3]);
      res.send(predictionResult);
    } else if (body.algorithm === ALGORITHMS.DENSE) {
      const result = await dense1Model(ds.data);
      res.send(result);
    }
  } catch (ex) {
    res.status(500).send("Error training data");
    console.error("Error training data: ", ex);
  }
});

app.listen(3000, () => {
  console.log("Server listening on port 3000");
  server.listen(8080, () => {
    console.log("WebSocket server is listening on port 8080");
  });
});
