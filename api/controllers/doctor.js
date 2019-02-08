'use strict';
const schedule = require('node-schedule');
const express = require('express');
const app = express();
const mysql = require('mysql');
const bodyParser = require('body-parser')
const nodemailer = require("nodemailer");
const util = require('util');

app.use(bodyParser.urlencoded({extended:true}));

const con = mysql.createConnection({
    host: "localhost",
    user: "root",
    password: "",
    database: "sampleDb"
});

con.connect(function(err) {
  if (err) {
  	throw err;
  	console.log(err)
  }	
  console.log("Connected!");
});

module.exports = {
    hello: hello,
    add_doc: add_doc,
    add_patient: add_patient,
    consult: consult,
    feedback: feedback
};

/********************************************************************** */ 
async function main(n, msg){
	let email
	let sql = "SELECT * FROM doctor_master where ID="+n;
	con.query(sql,function(err,result){
		if(err) throw err;
		email = result[0].email
		console.log("kjne "+email)
		let transporter = nodemailer.createTransport({
		service:'gmail',
		auth: {
		  user: 'hellomegha9673@gmail.com', 
		  pass: 'PAV4@bhaji'
		}
		});
		console.log(email)
		let mailOptions = {
			from: 'hellomegha9673@gmail.com', // sender address
			to: email, // list of receivers
			subject: "Feedback received", // Subject line
			text: msg, // plain text body
			html: '<p>Your html here</p>'
		};
		console.log(mailOptions)
		transporter.sendMail(mailOptions, function (err, info) {
			if(err)
			 console.log(err)
			else
			 console.log("email sent");
		});
	})	
}

async function patient_mail(n){
	let email;
	let sql = "SELECT * FROM patient_master WHERE id="+n;
	con.query(sql,function(err,result){
		if(err) throw err;
		email = result[0].email
		console.log(result)
		console.log('email jdnrdf   '+email)
	})

	let transporter = nodemailer.createTransport({
		service:'gmail',
		auth: {
		  user: 'megha9673@gmail.com', 
		  pass: 'm12e4g6h7a2'
		}
	});

	let mailOptions = {
	from: 'megha9673@gmail.com', // sender address
	to: email, // list of receivers
	subject: "Hello ✔", // Subject line
	text: "Your feedback is pending.", // plain text body
	html: '<p>Your html here</p>'
	};

	transporter.sendMail(mailOptions, function (err, info) {
		if(err)
		 console.log(err)
		else
		 console.log("email sent");
	});
}



schedule.scheduleJob({hour: 12, minute: 45, dayOfWeek: 5}, function(){
	console.log('The answer to life, the universe, and everything!');
	let sql = "SELECT * FROM consultation_master"
	con.query(sql, function (err, result) {
    	if (err) throw err;
    	console.log(result);
    	console.log(result[0].status);
    	let d1 = new Date();
    	result.forEach(function(r){
    		if(r.status==0){
    			let d2 = r.consultation_date
    			let timeDiff = Math.abs(d2.getTime() - d1.getTime());
				let diffDays = Math.ceil(timeDiff / (1000 * 3600 * 24)); 
				if(diffDays >28 ){
					main(r.doctor_id,"feedback not filled");
				}
				else{
					patient_mail(r.patient_id).catch(console.error);
					console.log('send')
				}
    		}
    	})
    });

});



/***************************************************************** */
function hello(req, res) {
    console.log('11111111')
	res.json('home')
}

function add_doc(req,res){
    let sql = 'CALL checkemail(?)'
	let c,response
	con.query(sql,[req.body.email], function(err, result) {
		if(err){
			console.log(err)
			response='cannot regidter doctor'
		}
		else{
			console.log(JSON.stringify(result[0][0]))
			c= JSON.stringify(result[0][0])
			console.log(c[12])
			//console.log(JSON.parse(result[0][0]))
			if(c[12]>0){
				console.log(c[12])
				response='Email already exists'
			}
			else{
				let sql = "INSERT INTO doctor_master (email, password, name) VALUES ('"+req.swagger.body.email+"', '"+req.swagger.body.password+"','"+ req.body.full_name+"')";
				con.query(sql, function (err, result) {
			    	if (err) throw err;
			    	console.log("1 record inserted");
			    });
			    response='registered'
			}
		}
		res.json({
			'message':response
		})
	})
}

function add_patient(req,res){
    let sql = "INSERT INTO patient_master (email, password, name) VALUES ('"+req.swagger.body.email+"', '"+req.swagger.body.password+"','"+ req.body.full_name+"')";
	con.query(sql, function (err, result) {
    	if (err) throw err;
    	console.log("1 record inserted");
    });
    res.json({
    	'message': 'registered'
    })
}

function consult(req,res){
    let sql = "INSERT INTO consultation_master (doctor_id, patient_id, status) VALUES ('"+req.swagger.query.d_id+"', '"+req.swagger.query.p_id+"', 0)";
	con.query(sql, function (err, result) {
    	if (err) throw err;
    	console.log("1 record inserted");
    });
    res.json({
    	'message': 'registered'
    })
}

function feedback(req,res){
    let sql = "SELECT status from consultation_master WHERE doctor_id="+req.swagger.query.d_id+" and patient_id="+req.swagger.query.p_id;
	con.query(sql, function (err, result) {
    	if (err) throw err;
    	result.status = 1
    });

	main(req.query.d_id,req.body.response)
	res.json('response send to doctor')
}