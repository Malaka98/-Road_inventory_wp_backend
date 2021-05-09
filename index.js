const express = require("express");
const multer = require("multer");
const mysql = require("mysql");
const jwt = require("jsonwebtoken");
const cookieParser = require("cookie-parser");
const helmet = require("helmet");
var CryptoJS = require("crypto-js");
var fs = require("fs");
// var router = express.Router();

var cors = require("cors");
const app = express();
app.use(cookieParser());
app.use(helmet());
//app.use(cors())
// app.use("/api", router);

const corsOptions = {
  origin: "http://localhost:3000",
  credentials: true, //access-control-allow-credentials:true
  optionSuccessStatus: 200,
};

app.use(cors(corsOptions));

app.listen(4000, () => {
  console.log("Server is up");
});

/*----------------------------//SQL Connection//-------------------------------*/
const connection = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "test",
});

/*----------------------------//SQL Connection Check//-------------------------------*/

connection.connect(function (err) {
  if (err) {
    console.error("error connecting: " + err.stack);
    return;
  }
});

/*----------------------------//Genarate ID//-------------------------------*/
const gid = () => {
  return new Date().getTime();
};
var id = null;
// var docid = null

/*----------------------------//File upload//-------------------------------*/

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "/home/root-x/Documents/React_JS/react/my-project/public/uploads");
  },
  filename: function (req, file, cb) {
    cb(null, id);
    //console.log(file.originalname);
  },
});

const upload = multer({ storage: storage }).single("img");

app.post("/upload", function (req, res) {
  id = gid().toString();
  upload(req, res, function (err) {
    if (err) return res.send("Error uploading file.");
    // docid = req.body["id"];
    let data = {
      img_id: id,
      d_id: req.body["id"],
    };

    connection.query(
      `INSERT INTO doc_img SET ?`,
      [data],
      (error, results, fields) => {
        if (error) console.log(error);

        // res.send(results)
        res.send("File is uploaded successfully!");
      }
    );
  });
});

/*----------------------------//Create New Document//-------------------------------*/

// router.post("/newdocument", authToken, multer().none(), (req, res)=>{
app.post("/newdocument", authToken, multer().none(), (req, res) => {
  id = gid().toString();

  let data = {
    ID: id,
    data1: req.body["txt1"],
    data2: req.body["txt2"],
    data3: req.body["txt3"],
    data4: req.body["txt4"],
    data5: req.body["txt5"],
    data6: req.body["txt6"],
    data7: req.body["txt7"],
    data8: req.body["txt8"],
    data9: req.body["txt20"],
    data10: req.body["txt21"],
    data11: req.body["txt22"],
  };

  let data2 = {
    T1data1: req.body["txt9"],
    T1data2: req.body["txt10"],
    T1data3: req.body["txt11"],
    T1data4: req.body["txt12"],
    T1data5: req.body["txt13"],
    T1data6: req.body["txt14"],
    T1data7: req.body["txt15"],
    T1data8: req.body["txt16"],
    T1data9: req.body["txt17"],
    T1data10: req.body["txt18"],
    T1data11: req.body["txt19"],
    d_id: id,
  };
  //console.log(data);
  connection.beginTransaction(function (err) {
    if (err) {
      throw err;
    }
    connection.query(
      "INSERT INTO document SET ?",
      data,
      function (error, results, fields) {
        if (error) {
          return connection.rollback(function () {
            throw error;
          });
        }

        connection.query(
          "INSERT INTO table1 SET ?",
          data2,
          function (error, results, fields) {
            if (error) {
              return connection.rollback(function () {
                throw error;
              });
            }
            connection.commit(function (err) {
              if (err) {
                return connection.rollback(function () {
                  throw err;
                });
              }
              console.log("success!");
            });
          }
        );
      }
    );
  });

  res.send("File is uploaded successfully!");
});

/*----------------------------//Login user//-------------------------------*/

app.post("/login", multer().none(), (req, res, next) => {
  let data = {
    uname: req.body["uname"],
    pass: req.body["pass"],
  };
  //console.log(data)
  //res.send(req.body['uname'])
  connection.query(
    "SELECT * FROM `admin` WHERE `uname` = ? AND `pass` = ?",
    [data.uname, data.pass],
    (error, results, fields) => {
      if (error) throw error;

      if (results != "") {
        jwt.sign({ user: results }, "privateKey.key", function (err, token) {
          if (err) throw err;
          //console.log(token);
          //res.send({userToken: token, access:'ok'})
          const aesToken = CryptoJS.AES.encrypt(token, "123").toString();
          res
            .cookie("accessToken", aesToken, { httpOnly: true, sameSite: true })
            .send("authorized_user"); //secure:true
          //maxAge: 900000,
        });
      } else {
        //res.send('please check your username or password')
        res.send({ access: "false" });
      }
    }
  );
});

/*----------------------------//Authenticate checker//-------------------------------*/

app.post("/check", authToken, (req, res) => {
  //console.log(req.user[0]['id'])
  //res.json(req.user[0]['id'])
  const uinfo = req.user[0]["uname"];
  const aesRes = CryptoJS.AES.encrypt(uinfo, "123").toString();
  //  console.log(aesRes);
  res.json({
    uinfo: aesRes,
    auth: "login",
  });
});

function authToken(req, res, next) {
  let token = req.cookies.accessToken;
  //console.log(token);
  if (typeof token != "undefined") {
    let bytes = CryptoJS.AES.decrypt(token, "123");
    let decToken = bytes.toString(CryptoJS.enc.Utf8);
    jwt.verify(decToken, "privateKey.key", (err, details) => {
      if (err) {
        res.send("Access denied");
      } else {
        req.user = details.user;
        next();
        // res.json(details.user)
        // console.log(details.user);
      }
    });
  } else {
    res.send("Unauthorized Request");
  }
}

/*----------------------------//Logout user//-------------------------------*/

app.post("/logout", authToken, (req, res) => {
  res.clearCookie("accessToken", { sameSite: true }).json({
    logout: "Successfully logged out",
  });
});

/*----------------------------//Get Data//-------------------------------*/

app.get("/getdocuments", (req, res) => {
  connection.query("SELECT * FROM document", (error, results, fields) => {
    if (error) throw error;

    res.json(results);
  });
});

/*----------------------------//Get Data//-------------------------------*/

app.post("/getfulldetail", multer().none(), (req, res) => {
  // console.log(req);
  let data = req.body["id"];
  let resData = {};
  connection.query(
    "SELECT * FROM document WHERE ID = ?",
    [data],
    (error, results, fields) => {
      if (error) throw error;

      resData.document = results;
      connection.query(
        "SELECT * FROM table1 WHERE d_id = ?",
        [data],
        (error, results, fields) => {
          if (error) throw error;
          // if(results) {resData.table1=results}else{resData.table1=null}
          resData.table1 = results;
          connection.query(
            "SELECT * FROM table3 WHERE d_id = ?",
            [data],
            (error, results, fields) => {
              if (error) throw error;

              resData.table2 = results;
              console.log(resData);
              res.json(resData);
            }
          );
        }
      );
    }
  );
});

/*----------------------------//Search box//-------------------------------*/

app.post("/search", multer().none(), (req, res) => {
  //console.log(req.body["searchKey"]);
  connection.query(
    `SELECT * FROM document WHERE data2 LIKE \'%${req.body["searchKey"]}%\'`,
    (error, results, fields) => {
      if (error) console.log(error);

      res.json(results);
    }
  );
});

/*----------------------------//Delete Doc//-------------------------------*/

app.post("/deletedoc", authToken, multer().none(), (req, res) => {
  //console.log(req.body["id"]);
  let img_id = null;
  connection.beginTransaction(function (err) {
    if (err) {
      throw err;
    }

    connection.query(
      `SELECT img_id FROM doc_img WHERE d_id=?`,
      [req.body["id"]],
      function (error, results, fields) {
        if (error) {
          return connection.rollback(function () {
            throw error;
          });
        }

        if (results.length !== 0) {
          img_id = results[0].img_id;
        }

        connection.query(
          `DELETE FROM doc_img WHERE d_id=?`,
          [req.body["id"]],
          function (error, results, fields) {
            if (error) {
              return connection.rollback(function () {
                throw error;
              });
            }

            connection.query(
              "DELETE FROM table3 WHERE d_id=?",
              [req.body["id"]],
              function (error, results, fields) {
                if (error) {
                  return connection.rollback(function () {
                    console.log(error);
                  });
                }

                connection.query(
                  "DELETE FROM table1 WHERE d_id=?",
                  [req.body["id"]],
                  function (error, results, fields) {
                    if (error) {
                      return connection.rollback(function () {
                        throw error;
                      });
                    }
                    connection.query(
                      "DELETE FROM document WHERE ID=?",
                      [req.body["id"]],
                      function (error, results, fields) {
                        if (error) {
                          return connection.rollback(function () {
                            throw error;
                          });
                        }

                        connection.commit(function (err) {
                          if (err) {
                            return connection.rollback(function () {
                              console.log(err);
                            });
                          }
                          if (img_id != null) {
                            let filePath = `/home/root-x/Documents/React_JS/react/my-project/public/uploads/${img_id}`;
                            fs.unlinkSync(filePath);
                          }
                          console.log("success!");
                          res.json("success!");
                        });
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    );
  });
});

app.post("/deletetable1", authToken, multer().none(), (req, res) => {
  //console.log(req.body["id"]);
  connection.query(
    `DELETE FROM table1 WHERE t1_id=?`,
    [req.body["id"]],
    (error, results, fields) => {
      if (error) console.log(error);
      res.json(results);
    }
  );
});

app.post("/deletetable2", authToken, multer().none(), (req, res) => {
  //console.log(req.body["id"]);
  connection.query(
    `DELETE FROM table3 WHERE t2_id=?`,
    [req.body["id"]],
    (error, results, fields) => {
      if (error) console.log(error);
      res.json(results);
    }
  );
});

/*----------------------------//Add New Recode | Table1//-------------------------------*/

app.post("/addnewrecode", authToken, multer().none(), (req, res) => {
  //console.log(req.body);
  connection.query(
    `INSERT INTO table1 SET ?`,
    [req.body],
    (error, results, fields) => {
      if (error) console.log(error);

      res.send(results);
    }
  );
});

/*----------------------------//Add New Recode | Table2//-------------------------------*/

app.post("/addnewrecode2", authToken, multer().none(), (req, res) => {
  //console.log(req.body);
  connection.query(
    `INSERT INTO table3 SET ?`,
    [req.body],
    (error, results, fields) => {
      if (error) console.log(error);

      res.send(results);
    }
  );
});

/*----------------------------//Update document | table//-------------------------------*/

app.post("/updatedocument", authToken, multer().none(), (req, res) => {
  //console.log(req.body);
  let data = {
    data1: req.body["data1"],
    data2: req.body["data2"],
    data3: req.body["data3"],
    data4: req.body["data4"],
    data5: req.body["data5"],
    data6: req.body["data6"],
    data7: req.body["data7"],
    data8: req.body["data8"],
    data9: req.body["data9"],
    data10: req.body["data10"],
    data11: req.body["data11"],
  };
  connection.query(
    `UPDATE document SET ? WHERE ID=?`,
    [data, req.body["ID"]],
    (error, results, fields) => {
      if (error) console.log(error);

      res.send(results);
    }
  );
});

/*----------------------------//Update row | table1//-------------------------------*/

app.post("/updaterowtable1", authToken, multer().none(), (req, res) => {
  console.log(req.body);
  let data = {
    T1data1: req.body["txt9"],
    T1data2: req.body["txt10"],
    T1data3: req.body["txt11"],
    T1data4: req.body["txt12"],
    T1data5: req.body["txt13"],
    T1data6: req.body["txt14"],
    T1data7: req.body["txt15"],
    T1data8: req.body["txt16"],
    T1data9: req.body["txt17"],
    T1data10: req.body["txt18"],
    T1data11: req.body["txt19"],
  };
  connection.query(
    `UPDATE table1 SET ? WHERE t1_id=?`,
    [data, req.body["id"]],
    (error, results, fields) => {
      if (error) console.log(error);

      res.send(results);
    }
  );
});

/*----------------------------//Update row | table2//-------------------------------*/

app.post("/updaterowtable2", authToken, multer().none(), (req, res) => {
  console.log(req.body);
  let data = {
    T2data1: req.body["txt20"],
    T2data2: req.body["txt21"],
    T2data3: req.body["txt22"],
  };
  connection.query(
    `UPDATE table3 SET ? WHERE t2_id=?`,
    [data, req.body["id"]],
    (error, results, fields) => {
      if (error) console.log(error);

      res.send(results);
    }
  );
});

/*----------------------------//Get Image//-------------------------------*/

app.post("/getimage", multer().none(), (req, res) => {
  connection.query(
    `SELECT img_id FROM doc_img WHERE d_id=?`,
    [req.body["id"]],
    (error, results, fields) => {
      if (error) console.log(error);

      res.json(results);
    }
  );
});

/*----------------------------//Delete Image//-------------------------------*/

app.post("/delimage", authToken, multer().none(), (req, res) => {
  // var filePath = '/home/root-x/Documents/React_JS/react/my-project/public/uploads';
  let img_id = null;
  // try{
  connection.beginTransaction(function (err) {
    if (err) {
      throw err;
    }
    connection.query(
      `SELECT img_id FROM doc_img WHERE d_id=?`,
      [req.body["id"]],
      function (error, results, fields) {
        if (error) {
          return connection.rollback(function () {
            throw error;
          });
        }
        img_id = results[0].img_id;
        connection.query(
          `DELETE FROM doc_img WHERE d_id=?`,
          [req.body["id"]],
          function (error, results, fields) {
            if (error) {
              return connection.rollback(function () {
                throw error;
              });
            }
            connection.commit(function (err) {
              if (err) {
                return connection.rollback(function () {
                  throw err;
                });
              }
              let filePath = `/home/root-x/Documents/React_JS/react/my-project/public/uploads/${img_id}`;
              fs.unlinkSync(filePath);
              // console.log(img_id);
              console.log("success!");
              // res.json("success!")
            });
          }
        );
      }
    );
  });
  res.json("success!");
  // } catch (e){
  //   res.json("Cant upload")
  // }
});
