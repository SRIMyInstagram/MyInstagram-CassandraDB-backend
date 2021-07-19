const express = require('express');
const router = express.Router();
const cassandra = require('cassandra-driver');

const client = new cassandra.Client({
    contactPoints: ['127.0.0.1'],
    localDataCenter: 'datacenter1',
    keyspace: 'myinstagram'
});
client.connect().catch(e => console.error(e));
client.connect(function(err, result){
	console.log('Post: cassandra connected');
});


 function toMap (obj){
     let value ="";

    for(let i=0;i< obj.length;i++){
        if(obj[i]===`"`){
            let temp =`'`;
            value+=temp;
        }
        else{
            value+=obj[i];
        }
    }
    return value;
 }

 function toSet(obj){
     return "{"+obj+"}"
 }

router.put('/post',async(req,res)=>{
    try{
        
        let abcd  = await toMap(JSON.stringify(req.body.tagged))
        const a = cassandra.types.Uuid;
        const b = a.random();
    const post = 'insert into post (tagged,p_id,u_id,createdAt,modifiedAt,caption,location,type,likes,savedCount,hashTags,deleted,commenting,archived,count,title,music,sharedCount,disabled,insights) values ('+abcd+',?,?,toTimestamp(now()),toTimestamp(now()),?,?, {\'Reel\' : false, \'Post\' : true, \'IGTV\' : false},0,0,?,false,true,false,true,?,now(), 0,false,{\'profileVisits\': 0, \'follows\' : 0, \'impressions\' : 0})'
    client.execute(post,[b,req.body.u_id,req.body.caption,req.body.location,req.body.hashTags,req.body.title],async(err,data)=>{
        if(err){
			return res.status(400).send({
                error:true, 
                msg: err
            });
		} else {
		
            const addtoUser = 'update user set posts = posts + ? where email =?'
            const arr = [];
            arr.push(b);
            client.execute(addtoUser,[arr,req.body.u_id],{prepare:true},async(err,result)=>{
                if(err){
                    return res.status(400).send({
                        error:true,
                        msg: err
                    });
                } else {
                    res.send({
                        error : false,
                        msg : 'Post uploaded Sucessfully'
                    }
                    );
                }
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

router.get('/getpost',async(req,res)=>{
    try{
        const post = 'select * from post where p_id=?'
        client.execute(post,[req.body.id],async(err,data)=>{
            if(err){
                return res.status(400).send({
                    error:true,
                    msg: err
                });
            } else {
                //console.log('User found');
                
                res.send({
                    msg : data
                }
                );
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

router.post('/likes',async(req,res)=>{
    try{
        if(req.body.action){
            const post = 'select * from post where p_id=?'
            client.execute(post,[req.body.id],async(err,data)=>{
            if(err){
                return res.status(404).send({
                    error:true,
                    msg: err
                });
            } else {
                const up = 'update post set likes =?, likedBy=likedBy + ? where p_id = ?'

                let a = data.rows[0].likes;
                a = a+1;
                const arr = [];
                arr.push(req.body.likedBy)
                client.execute(up,[a,arr,req.body.id ],{ hints : ['int'] },async(err,result)=>{
                    if(err){
                        return res.status(400).send({
                            error:true,
                            msg: err
                        });
                    } else {    
                        // res.status(201).send({
                        //     error: false
                        // }
                        // );
                        
                        let x = await toSet(req.body.id)
                        const addto = 'update user set likedd = likedd +'+x+' where email = ?'
                        client.execute(addto,[req.body.likedBy],async(err,result)=>{
                            if(err){
                                return res.status(400).send({
                                    error:true,
                                    msg: err
                                });
                            }
                            else{
                                res.status(201).send({
                                        error: false
                                    }
                                    );
                            }
                        })
                    }
                })
            }
        })
        }else{
            const post = 'select * from post where p_id=?'
            client.execute(post,[req.body.id],async(err,data)=>{
            if(err){
                return res.status(400).send({
                    error:true,
                    msg: err
                });
            } else {
                const up = 'update post set likes =?, likedBy=likedBy - ? where p_id = ?'

                let a = data.rows[0].likes;
                a = a-1;
                const arr = [];
                arr.push(req.body.likedBy)
                client.execute(up,[a,arr,req.body.id ],{ hints : ['int'] },async(err,result)=>{
                    if(err){
                        return res.status(400).send({
                            error:true,
                            msg: err
                        });
                    } else {    
                        // res.status(201).send({
                        //     error: false
                        // }
                        // );
                        
                        let x = await toSet(req.body.id)
                        const addto = 'update user set likedd = likedd -'+x+' where email = ?'
                        client.execute(addto,[req.body.likedBy],async(err,result)=>{
                            if(err){
                                return res.status(400).send({
                                    error:true,
                                    msg: err
                                });
                            }
                            else{
                                res.status(201).send({
                                        error: false
                                    }
                                    );
                            }
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



router.post('/save',async(req,res)=>{
    try{
        if(req.body.save){
            const post = 'select savedcount from post where p_id = ?';
        client.execute(post,[req.body.p_id],{prepare:true},async(err,data)=>{
            if(err){
                return res.status(400).send({
                    error:true,
                    msg: err
                });
            }else{
                data.rows[0].savedcount+=1;
                const a = data.rows[0].savedcount;
                const count = 'update post set savedcount = ? where p_id=?'
                client.execute(count,[a,req.body.p_id],{hints : ['int'],prepare:true},async(err,result)=>{
                    if(err){
                        return res.status(400).send({
                            error:true,
                            msg: err
                        });
                    }else{
                        const arr = [];
                        arr.push(req.body.p_id)
                        const save = 'update user set savedposts = savedposts + ? where email = ?';
                        client.execute(save,[arr,req.body.email],{prepare:true},async(err,da)=>{
                            if(err){
                                return res.status(400).send({
                                    error:true,
                                    msg: err
                                });
                            }else{
                                res.status(200).send({
                                    error:false,
                                    msg : "The post saved successfully!!!"
                                })
                            } 
                        })
                    }
                })
            }
        })
        }else{
            const post = 'select savedcount from post where p_id = ?';
        client.execute(post,[req.body.p_id],{prepare:true},async(err,data)=>{
            if(err){
                return res.status(400).send({
                    error:true,
                    msg: err
                });
            }else{
                data.rows[0].savedcount-=1;
                const a = data.rows[0].savedcount;
                const count = 'update post set savedcount = ? where p_id=?'
                client.execute(count,[a,req.body.p_id],{hints : ['int'],prepare:true},async(err,result)=>{
                    if(err){
                        return res.status(400).send({
                            error:true,
                            msg: err
                        });
                    }else{
                        const arr = [];
                        arr.push(req.body.p_id)
                        const save = 'update user set savedposts = savedposts - ? where email = ?';
                        client.execute(save,[arr,req.body.email],{prepare:true},async(err,da)=>{
                            if(err){
                                return res.status(400).send({
                                    error:true,
                                    msg: err
                                });
                            }else{
                                res.status(200).send({
                                    error:false,
                                    msg : "The post removed successfully!!!"
                                })
                            } 
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

router.post('/archive',async(req,res)=>{
    try{
        if(req.body.archive){
            const archive = 'update post set archived = true where p_id =?'
        client.execute(archive,[req.body.p_id],{prepare:true},async(err,data)=>{
            if(err){
                return res.status(400).send({
                    error:true,
                    msg: err
                });
            }else{
                res.status(200).send({
                    error:false,
                    msg : "The post Archived successfully!!!"
                })
            } 
        })
        }else{
            const archive = 'update post set archived = false where p_id =?'
        client.execute(archive,[req.body.p_id],{prepare:true},async(err,data)=>{
            if(err){
                return res.status(400).send({
                    error:true,
                    msg: err
                });
            }else{
                res.status(200).send({
                    error:false,
                    msg : "The post Un-Archived successfully!!!"
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