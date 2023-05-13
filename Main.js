// Importing Library

const express = require("express"),
  app = express(),
  ejs = require("ejs"),
  path = require("path"),
  bodyParser = require("body-parser"),
  flash = require("connect-flash"),
  session = require("express-session"),
  passport = require("passport"),
  LocalStrategy = require("passport-local"),
  ensureLogin = require("connect-ensure-login"),
  bcrypt = require("bcrypt");

const saltRound = 10;

const { sequelize } = require("./models");
const { DataTypes } = require("sequelize");

const Teacher = require("./models/teacher")(sequelize, DataTypes),
  classDetail = require("./models/classdetail")(sequelize, DataTypes),
  studentDetail = require("./models/studentdetail")(sequelize, DataTypes),
  Attendance = require("./models/attendance")(sequelize, DataTypes);
app.use(
  session({
    secret: "this_should_be_32_character_long",
    cookie: {
      maxAge: 60 * 60 * 24 * 1000, //24 Hours
    },
  })
);
// Setup View Engine
app.set("view engine", "ejs");
app.set("views", path.join(__dirname + "/views"));

app.use(bodyParser.json());
app.use(express.urlencoded({ extended: false }));
app.use(flash());
app.use(passport.initialize());
app.use(passport.session());

passport.use(
  new LocalStrategy(
    {
      usernameField: "email",
      passwordField: "password",
    },
    (username, password, done) => {
      Teacher.findOne({
        where: {
          email: username,
        },
      })
        .then(async function (user) {
          if (user) {
            const resultantPass = await bcrypt.compare(password, user.password);
            if (resultantPass) {
              return done(null, user);
            } else {
              return done(null, false, { message: "Invalid Password" });
            }
          } else {
            return done(null, false, { message: "User Does Not Exist" });
          }
        })
        .catch((error) => {
          console.log(error);
          return error;
        });
    }
  )
);

passport.serializeUser((user, done) => {
  console.log("Serealizing User in Session", user.id);
  done(null, user.id);
});

passport.deserializeUser((id, done) => {
  Teacher.findByPk(id)
    .then((user) => {
      done(null, user);
    })
    .catch((err) => {
      done(err, null);
    });
});

app.use(function (request, response, next) {
  const Message = request.flash();
  response.locals.messages = Message;
  next();
});

let today = new Date().toLocaleDateString("en-In");

app.get("/", (request, response) => {
  response.render("Login");
});

app.get("/SignUp", (request, response) => {
  response.render("SignUp");
});

app.get(
  "/Home/Login",
  ensureLogin.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    let User = request.user,
      classList = await classDetail.getClass(String(request.user.id));
    response.render("Home", { today, User, classList });
  }
);

app.get(
  "/AddNew/Class",
  ensureLogin.ensureLoggedIn({ redirectTo: "/" }),
  (request, response) => {
    response.render("AddClass");
  }
);

app.get(
  "/ClassDetail/:id",

  async (request, response) => {
    try {
      let classdetail = await classDetail.findByPk(request.params.id);
      let students = await studentDetail.getList(request.params.id);
      let attendance = await Attendance.getAttencdanceList(
        request.params.id,
        today
      );
      console.log(students);
      console.log(attendance);
      response.render("ClassDetail", {
        classdetail,
        today,
        students,
        attendance,
      });
    } catch (error) {
      console.log(`Error:${error}`);
      response.send(error);
    }
  }
);
app.get(
  "/AddnewStudent/:id",
  ensureLogin.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    try {
      let Class = await classDetail.findByPk(request.params.id);
      response.render("AddStudent", { Class });
    } catch (error) {
      response.send(error);
    }
  }
);

app.get("/Add/Attendance/:id", async (request, response) => {
  try {
    let studentList = await studentDetail.getList(request.params.id);
    console.log(studentList);
    response.render("Attendace", {
      students: studentList,
      today,
      Id: request.params.id,
    });
  } catch (error) {
    response.status(404).send(error);
  }
});

app.get("/Student/:id", async (request, response) => {
  try {
    let students = await studentDetail.getList(request.params.id);
    let classdetail = await classDetail.findByPk(request.params.id);
    console.log(classdetail);
    response.render("StudentList", { students, classdetail });
  } catch (error) {
    console.log("Error:" + error);
    response.send(error);
  }
});

app.get(
  "/Attendance/Recorde/:id/:day/:month/:year",
  async (request, response) => {
    try {
      let date = `${request.params.day}/${request.params.month}/${request.params.year}`;
      let studentAttendance = await Attendance.getAttencdanceList(
        request.params.id,
        date
      );
      let presentStudent = await Attendance.getPresent(request.params.id, date);

      response.render("Record", {
        Id: request.params.id,
        sta: studentAttendance,
        presentStudent,
      });
    } catch (error) {
      console.log("Error:" + error);
      response.send(error);
    }
  }
);
app.get(
  "/Signout",
  ensureLogin.ensureLoggedIn({ redirectTo: "/" }),
  (request, response) => {
    try {
      request.logout((err) => {
        if (err) {
          return next(err);
        }
        request.flash("success", "Signout Successfully");
        response.redirect("/");
      });
    } catch (error) {
      console.log("Error:" + error);
      response.status(402).send(error);
    }
  }
);

app.post(
  "/Admin/Login",
  passport.authenticate("local", { failureFlash: true, failureRedirect: "/" }),
  (request, response) => {
    let User = request.user;
    response.redirect("/Home/Login");
  }
);

app.post("/Admin/Signup", async (request, response) => {
  try {
    let FindUser = await Teacher.getEmail(request.body.email.trim());

    if (FindUser.length == 0) {
      if (request.body.firstName.trim().length != 0) {
        if (request.body.email.trim().length != 0) {
          if (request.body.password.trim().length >= 8) {
            let hashPass = await bcrypt.hash(
              request.body.password.trim(),
              saltRound
            );
            let User = await Teacher.create({
              FirstName: request.body.firstName.trim(),
              email: request.body.email.trim(),
              password: hashPass,
            });
            console.log(
              "User Created Successfully with Following Detail:\n" + User
            );
            request.login(User, (err) => {
              if (err) {
                console.log(err);
              }
              request.flash("success", "User Suceessfully Created");
              return response.redirect("/Home/Login");
            });
          } else {
            request.flash("error", "Password Length Must Greter than 8");
            response.redirect("back");
          }
        } else {
          request.flash("error", "Please Provide Email");
          response.redirect("back");
        }
      } else {
        request.flash("error", "Please Provide First Name");
        response.redirect("back");
      }
    } else {
      request.flash("error", "Email Already Exist");
      response.redirect("back");
    }
  } catch (error) {
    console.log("Error" + error);
    response.send(error);
  }
});

app.post(
  "/AddNewClass",
  ensureLogin.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    let status = true,
      classTitle,
      stTime,
      enTime;
    let getClassList = await classDetail.getClass(new String(request.user.id));
    let sTime = TimeConvert(request.body.startTime);
    let eTime = TimeConvert(request.body.endTime);
    getClassList.map((item) => {
      if (
        (item.StartTime < sTime && sTime < item.EndTime) ||
        eTime < item.EndTime
      ) {
        status = false;
        classTitle = item.ClassName;
        stTime = item.StartTime;
        enTime = item.EndTime;
      }
    });
    try {
      if (request.body.classTitle.trim().length != 0) {
        if (status) {
          let createClass = await classDetail.create({
            ClassName: request.body.classTitle.trim(),
            StartTime: sTime,
            EndTime: eTime,
            ClassId: request.user.id,
          });
          console.log(createClass);
          request.flash("success", "Class Created Successfully");
          response.redirect("/Home/Login");
        } else {
          request.flash(
            "error",
            `${stTime}-${enTime} is Allocated for ${classTitle}`
          );
          response.redirect("back");
        }
      } else {
        request.flash("error", "Please Provide Class Name");
        response.redirect("back");
      }
    } catch (error) {
      console.log("Error:" + error);
      response.json(error);
    }
  }
);

app.post(
  "/AddNewStudent/:id",
  ensureLogin.ensureLoggedIn({ redirectTo: "/" }),
  async (request, response) => {
    console.log("Called");
    try {
      if (request.body.studentName.trim().length != 0) {
        let createStudent = await studentDetail.create({
          SName: request.body.studentName.trim(),
          SNumber: request.body.studentNumber,
          PNumber: request.body.parentNumber,
          classId: request.params.id,
        });
        console.log(createStudent);
        request.flash("success", "Student Added Successfully");
        response.redirect(`/classDetail/${request.params.id}`);
      } else {
        request.flash("error", "Please Provide Student Name");
        response.redirect("back");
      }
    } catch (error) {
      console.log("Error:" + error);
      response.json(error);
    }
  }
);

app.post("/Attendance/:id", async (request, response) => {
  try {
    console.log(request.body);
    console.log(request.params.id);
    let studentName = await studentDetail.getStudentName(request.params.id);
    console.log(studentName.SName);
    let attendanceDetail = await Attendance.create({
      Name: studentName.SName,
      studentClassId: request.body.Id,
      Status: request.body.Status,
      Date: today,
      userId: request.params.id,
    });
    console.log(attendanceDetail);
    return response.json(attendanceDetail ? true : false);
  } catch (error) {
    console.log(`Error:${error}`);
    response.send(error);
  }
});
app.delete("/Delete/Batch/:id", async (request, response) => {
  try {
    let DeleteBatch = await classDetail.Removebatch(
      String(request.user.id),
      String(request.params.id)
    );
    let deleteStudent = await studentDetail.removeStudent(request.params.id);
    if (DeleteBatch) {
      request.flash("success", "Successfully Deleted");
    } else {
      request.flash("error", "Failed To Delete");
    }
    // response.redirect(`/Delete/student/${request.params.id}`);
    return response.send(DeleteBatch ? true : false);
  } catch (error) {
    console.log("Error:" + error);
  }
});

app.delete("/Delete/student/:id", async (request, response) => {
  try {
    let deleteStudent = await studentDetail.deleteStudent(request.params.id);
    let attendanceDelete = await Attendance.deleteAttendance(request.params.id);
    console.log(attendanceDelete);
    console.log(deleteStudent);
    if (deleteStudent) {
      request.flash("success", "Successfully Deleted");
    } else {
      request.flash("error", "Failed To Delete");
    }
    return response.send(deleteStudent ? true : false);
  } catch (error) {
    console.log("Error:" + error);
  }
});

//! Time Conversion Function from 24 Hrs to 12 Hrs

const TimeConvert = (time) => {
  let hour = time.split(":")[0];
  hour == 0 ? hour + 12 : hour;
  time = [hour, time.split(":")[1]].join(":");
  return time;
};

module.exports = app;
