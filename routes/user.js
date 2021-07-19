const express = require('express');
const router = express.Router();
const cassandra = require('cassandra-driver');
const bcrypt = require('bcrypt');
const { check, validationResult } = require('express-validator');



const client = new cassandra.Client({
    contactPoints: ['127.0.0.1'],
    localDataCenter: 'datacenter1',
    keyspace: 'myinstagram'
});
client.connect().catch(e => console.error(e));
client.connect(function(err, result){
	console.log('user: cassandra connected');
});

router.post('/signup',[
    check('email', 'Please Enter a Valid E-mail').isEmail(),
    check('username', 'Please Enter a Valid username').not().isEmpty(),
    check('password', 'Please Enter a Valid Password').isLength({min: 8,}).notEmpty(),
],async(req,res)=>{
    const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                msg: errors.errors[0].msg,
            });
        }
    try{
    const user = 'insert into user (username,email,phoneNo,password,fullname,dob,createdAT,modifiedAT,language,gender,accountType,accountType2,account,verified,allowReplyReaction,manuallyApproveTags,allowTagsFrom,likeViewCount,activity,allowCommentFrom,checkComment,allowAtMention,allowToShareOnStory,shareStory,restrictedAccount,storyArchive,liveArchive,postCount,storyCount,commentCount) values (?,?,?,?,?,?,toTimestamp(now()),toTimestamp(now()),\'en-us\',\'Prefer Not to Say\',true, {\'Normal\': true, \'Business\' : false , \'Professional\' : false}, true, false, {\'All\':true, \'none\': false, \'following\':false}, false, {\'All\':true, \'none\': false, \'following\':false}, true, true, {\'everyone\' : true,\'following\': true, \'followers\':true,\'followingFollowers\' : true}, false, { \'All\':true, \'none\':false, \'following\': false }, true, true, false, true, true, 0,0,0)';

    const exist = 'select username,email,phoneNo from user where email=?'
    client.execute(exist,[req.body.email],async(err,data)=>{
        if(err){
           return res.status(500).send({
               error:true,
               msg:'Something went wrong'
            })
        }
        if(data){

            if(data.rowLength==1){

                return res.status(400).send({
                    error:true,
                    msg:"Email already exists. Please select other email"
                })
        }
        }
    })
    if(req.body.phoneNo){
        if(req.body.phoneNo!=NULL){
            const exist1 = 'select username,email,phoneNo from user where phoneNo=?'
        client.execute(exist1,[req.body.phoneNo],async(err,data)=>{
        if(err){
           return res.status(500).send({
               error:true,
               msg:'Something went wrong'
            })
        }
        if(data){

            if(data.rowLength==1){

                return res.status(400).send({
                    error:true,
                    msg :"Phone Number already exists. Please enter different Phone Number"
                })
        }
        }
    })
        }
    }
    
    const exist2 = 'select username,email,phoneNo from user where username=?'
    client.execute(exist2,[req.body.username],async(err,data)=>{
        if(err){
           return res.status(500).send({
               error:true,
               msg:'Something went wrong'
            })
        }
        if(data){

            if(data.rowLength==1){

                return res.status(400).send({
                    error:true,
                    msg: "Username already exists. Please enter different Username"
                })
        }
        }
    })

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(req.body.password, salt);


    client.execute(user,[req.body.username,req.body.email,req.body.phoneNo,hashedPassword,req.body.fullname,req.body.dob],
		function(err, result){
			if(err){
			return res.status(404).send({
                error:true,
                msg: err
            });
		} else {
			//console.log('User found');
			res.send({
                error:false,
                msg : 'You Signed up Sucessfully'
            });
		}
		});
    }catch (err) {
        console.log(err);
        res.send({
            error: true,
            msg: err.message,
        });
    }
})

router.post('/signin',[
    check('email', 'Please Enter a Valid Email').isEmail(),
    check('password', 'Please enter a valid password').isLength({min: 8,}),
],async(req,res)=>{
    try{
        const errors = validationResult(req)
        if (!errors.isEmpty()) {
            return res.send({
                error: true,
                msg: errors.errors[0].msg,
            });
        }

        const exist = 'select * from user where email=?'
        let data = client.execute(exist,[req.body.email],async(err,data)=>{
        if(err){
             return res.status(500).send({
                 error:true,
                 msg:'Something went wrong'
                })
        }
        if(data.rowLength==0){
            return res.status(400).send({
                error:true,
                msg:"Account with given E-mail doesn't exists. Please Sign Up"
            })
        }else if(data.rowLength==1){

            const validPassword = await bcrypt.compare(req.body.password,data.rows[0].password)
            if (!validPassword) {
                return res.send({
                    error: true,
                    msg: 'Password is not valid',
                });
            }
            if(!data.rows[0].account){
                const ena = 'update user set account = true where username = ?'
                
                client.execute(ena,[req.body.email],async(err,resul)=>{
                    if(err){
                         return res.status(500).send({
                             error:true,
                             msg:'Something went wrong. Please try again later'
                            })
                    }

                })
            }
            res.send({
                error:false,
                msg:"User LoggedIn Successfully"
            })
        }
    })
    }catch (err) {
        console.log(err);
        res.send({
            error: true,
            msg: err.message,
        });
    }   
})

router.get('/username',async(req,res)=>{

	const user = 'select username from user where username=?';

	client.execute(user,[req.body.username],
		function(err, result){
			if(err){
			res.status(404).send({
                error:true,
                msg: err
            });
		} else if(result.rowLength==1) {
			//console.log('User found');
			res.status(400).send({
                error : true
            });
		}
        else if(result.rowLength==0){
            res.status(200).send({
                error : false
            })
        }
		});
})

router.get('/phoneNo',async(req,res)=>{

	const user = 'select phoneNo from user where phoneNo=?';

	client.execute(user,[req.body.phoneNo],
		function(err, result){
			if(err){
			res.status(404).send({
                error:true,
                msg: err});
		} else if(result.rowLength==1) {
			res.status(400).send({
                error : true
            });
		}
        else if(result.rowLength==0){
            res.status(200).send({
                error : false
            })
        }
		});
})


router.patch('/updateprofile',async(req,res)=>{
    try{
        const user = 'select * from user where email=?'

	client.execute(user,[req.body.email],
		async(err, result)=>{
			if(err){
			res.status(404).send({
                error:true,
                msg: err});
		} else {
			const up = 'update user set username =?,phoneNo = ?,fullname=?,dob=?, gender =?,bio =?,website=?,modifiedAt=toTimestamp(now()) where email=?'
            if(req.body.username){
                result.rows[0].username = req.body.username
            }
            if(req.body.phoneNo){
                result.rows[0].phoneNo = req.body.phoneNo
            }
            if(req.body.fullname){
                result.rows[0].fullname = req.body.fullname
            }
            if(req.body.dob){
                result.rows[0].dob = req.body.dob
            }
            if(req.body.gender){
                result.rows[0].gender = req.body.gender
            }
            if(req.body.bio){
                result.rows[0].bio = req.body.bio
            }
            if(req.body.website){
                result.rows[0].website = req.body.website
            }
            client.execute(up,[result.rows[0].username,result.rows[0].phoneNo,result.rows[0].fullname,result.rows[0].dob,
                result.rows[0].gender,result.rows[0].bio,result.rows[0].website,req.body.email],
                async(err, data)=>{
                    if(err){
                    res.status(400).send({
                        error:true,
                        msg: err
                    });
                } else {
                    res.status(201).send({
                        error: false,
                        msg : "Details Updated Succesfully"
                    } );
                }
                });

		}
		});

    }catch (err) {
        console.log(err);
        res.send({
            error: true,
            msg: err.message,
        });
    }
})


router.patch('/updateprofilepicture',async(req,res)=>{
    try{
        res.send("We will figure out Soon!!!")        
    }catch (err) {
        console.log(err);
        res.send({
            error: true,
            msg: err.message,
        });
    }
})


router.post('/report',async(req,res)=>{
    try{
        const report = 'insert into reportlog (id,type,category,object_id) values (now(),?,?,?)'
        client.execute(report,[req.body.type,req.body.category,req.body.object_id],{prepare:true},async(err,data)=>{
            if(err){
                res.status(400).send({
                    error:true,
                    msg: err
                });
            } else {
                res.send({
                    error : false,
                    msg : "Reported Successfully!!!"
                })
            }
        })
        
    }catch (err) {
        console.log(err);
        res.send({
            error: true,
            msg: err.message,
        });
    }
})

router.post('/blockprofile',async(req,res)=>{
    try{
        if(req.body.block){
            const block = 'update user set blockedusers = blockedusers + ?,followers = followers - ?,following = following - ? where email = ?'
        const blockf = 'update user set blockedfrom = blockedfrom + ?,followers = followers - ?,following = following - ? where email = ?'
        const arr = [];
        arr.push(req.body.user2_id);
        client.execute(block,[arr,arr,arr,req.body.user1_id],{prepare:true},async(err,data)=>{
            if(err){
                res.status(400).send({
                    error:true,
                    msg: err
                });
            } else {
                arr.pop();
                arr.push(req.body.user1_id);
                client.execute(blockf,[arr,arr,arr,req.body.user2_id],{prepare:true},async(err,data)=>{
                    if(err){
                        res.status(400).send({
                            error: true,
                            msg: err
                        });
                    } else {
                        res.status(201).send({
                            error : false,
                            msg : "User blocked successfully!!!!"
                        })
                    }
                })
            }
        })
        }else{
            const block = 'update user set blockedusers = blockedusers - ? where email = ?'
        const blockf = 'update user set blockedfrom = blockedfrom - ? where email = ?'
        const arr = [];
        arr.push(req.body.user2_id);
        client.execute(block,[arr,req.body.user1_id],{prepare:true},async(err,data)=>{
            if(err){
                res.status(400).send({
                    error:true,
                    msg: err
                });
            } else {
                arr.pop();
                arr.push(req.body.user1_id);
                client.execute(blockf,[arr,req.body.user2_id],{prepare:true},async(err,data)=>{
                    if(err){
                        res.status(400).send({
                            error: true,
                            msg: err
                        });
                    } else {
                        res.status(201).send({
                            error : false,
                            msg : "User Unblocked successfully!!!!"
                        })
                    }
                })
            }
        })
        }
                
    }catch (err) {
        console.log(err);
        res.send({
            error: true,
            msg: err.message,
        });
    }
})

router.post('/follow',async(req,res)=>{
    try{
        if(req.body.follow){
            const follow = 'select accountType from user where email = ?'
            client.execute(follow,[req.body.user2_id],{prepare:true},async(err,data)=>{
                if(err){
                    res.status(400).send({
                        error: true,
                        msg: err
                    });
                }else{
                    const arr = [];
                    arr.push(req.body.user1_id);
                    const arr2 = [];
                    arr2.push(req.body.user2_id);
                    if(data.rows[0].accounttype){ 
                        let queries = [{
                            query : 'update user set followers = followers + ? where email = ?',
                            params : [arr,req.body.user2_id]
                        },
                        {
                            query : 'update user set following = following +? where email = ?',
                            params : [arr2,req.body.user1_id]
                        }
                        ]
                        await client.batch(queries,{prepare:true});
                        res.status(200).send({
                            error: false,
                            msg : "Success!!!!!!!!"
                        })                    
                    }else{
                        const arr = [];
                        arr.push(req.body.user1_id)
                        let queries = [{
                            query : 'update user set  request = request + ? where email = ?',
                            params : [arr,req.body.user2_id]
                        }
                        ]
                        await client.batch(queries,{prepare:true});
                        res.status(200).send({
                            error: false,
                            msg : "Success!!!!!!!!"
                        })
                    }
                }
            })
        }else{
                const arr = [];
                arr.push(req.body.user1_id);
                const arr2 = [];
                arr2.push(req.body.user2_id);
                    let queries = [{
                        query : 'update user set followers = followers - ? where email = ?',
                        params : [arr,req.body.user2_id]
                    },
                    {
                        query : 'update user set following = following - ? where email = ?',
                        params : [arr2,req.body.user1_id]
                    }
                    ]
                    await client.batch(queries,{prepare:true});
                    res.status(200).send({
                         error: false,
                        msg : "Success!!!!!!!!"
                    })
        }     
    }catch (err) {
        console.log(err);
        res.send({
            error: true,
            msg: err.message,
        });
    }
})

router.post('/accept',async(req,res)=>{
    try{
        const arr = [];
        arr.push(req.body.user1_id);
        const arr2 = [];
        arr2.push(req.body.user2_id);
        if(req.body.accept){
            let queries = [{
                query : 'update user set followers = followers + ? where email = ?',
                params : [arr,req.body.user2_id]
            },
            {
                query : 'update user set following = following +? where email = ?',
                params : [arr2,req.body.user1_id]
            }
            ]
            await client.batch(queries,{prepare:true});
            const decline = 'update user set request = request - ? where email = ?'
            client.execute(decline,[arr,req.body.user2_id],{prepare:true},async(err,data)=>{
                if(err){
                    res.status(400).send({
                        error: true,
                        msg: err
                    });
                }else{
                    res.status(200).send({
                        error: false,
                        msg : "Success!!!!!!!!"
                    })        
                }
            })
        }else{
            const decline = 'update user set request = request - ? where email = ?'
            client.execute(decline,[arr,req.body.user2_id],{prepare:true},async(err,data)=>{
                if(err){
                    res.status(400).send({
                        error: true,
                        msg: err
                    });
                }else{
                    res.status(200).send({
                        error: false,
                        msg : "Success!!!!!!!!"
                    })        
                }
            })
        }
    }catch (err) {
        console.log(err);
        res.send({
            error: true,
            msg: err.message,
        });
    }
})

router.post('/hashtag',async(req,res)=>{
    try{
        if(req.body.follow){
            const arr = [];
        arr.push(req.body.hashtag)
        const hashtag = 'update user set hashtag = hashtag + ? where email = ?'
        client.execute(hashtag,[arr,req.body.email],{prepare:true},async(err,data)=>{
            if(err){
                res.status(400).send({
                    error: true,
                    msg: err
                });
            }else{
                res.status(200).send({
                    error: false,
                    msg : "Success!!!!!!!!"
                })        
            }
        })
        }else{
            const arr = [];
        arr.push(req.body.hashtag)
        const hashtag = 'update user set hashtag = hashtag - ? where email = ?'
        client.execute(hashtag,[arr,req.body.email],{prepare:true},async(err,data)=>{
            if(err){
                res.status(400).send({
                    error: true,
                    msg: err
                });
            }else{
                res.status(200).send({
                    error: false,
                    msg : "Success!!!!!!!!"
                })        
            }
        })
        }
        
    }catch (err) {
        console.log(err);
        res.send({
            error: true,
            msg: err.message,
        });
    }
})


module.exports = router;
