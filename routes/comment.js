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
	console.log('Comment: cassandra connected');
});

router.post('/likes',async(req,res)=>{
    try{
        if(req.body.action){
            const comment = 'select * from comment where comment_id=?'
            client.execute(comment,[req.body.id],async(err,data)=>{
            if(err){
                return res.status(404).send({msg: err});
            } else {
                const up = 'update comment set likes =?, likedBy=likedBy + ? where comment_id = ?'

                let a = data.rows[0].likes;
                a = a+1;
                const arr = [];
                arr.push(req.body.likedBy)
                client.execute(up,[a,arr,req.body.id ],{ hints : ['int'] },async(err,result)=>{
                    if(err){
                        return res.status(404).send({msg: err});
                    } else {    
                        res.status(201).send({
                            error: false
                        }
                        );
                    }
                })
            }
        })
        }else{
            const post = 'select * from comment where comment_id=?'
            client.execute(post,[req.body.id],async(err,data)=>{
            if(err){
                return res.status(404).send({msg: err});
            } else {
                const up = 'update comment set likes =?, likedBy=likedBy - ? where comment_id = ?'

                let a = data.rows[0].likes;
                a = a-1;
                const arr = [];
                arr.push(req.body.likedBy)
                client.execute(up,[a,arr,req.body.id ],{ hints : ['int'] },async(err,result)=>{
                    if(err){
                        return res.status(404).send({msg: err});
                    } else {    
                        res.status(201).send({
                            error: false
                        }
                        );
                        
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


router.post('/comment',async(req,res)=>{
    try{
        const a = cassandra.types.Uuid;
        const b = a.random();
        const comment = 'insert into comment (p_id,u_id,likes,timeStamp,rComment,comment_id,commentText,owner_id,disabled,bComment) values (?,?,0,toTimestamp(now()),?,?,?,?,false,false)';
        const user = 'select * from user where email=?'
        client.execute(user,[req.body.owner_id],{prepare:true},async(err,result)=>{
            if(err){
                return res.status(400).send({msg: err});
            } else {
                let rComment = false
                if(result.rows[0].restrictedaccount){
                    let arr = result.rows[0].restrictaccounts;
                    for(let i=0;i<arr.length;i++){
                        if(arr[i]===req.body.email){
                            rComment = true;
                        }
                    }
                }
                client.execute(comment,[req.body.p_id,req.body.email,rComment,b,req.body.text,req.body.owner_id],{prepare:true},async(err,data)=>{
                    if(err){
                        res.status(400).send({msg: err});
                    } else {
                        res.status(201).send({
                            error : false,
                            msg : "Comment inserted successfully!!!"
                        });
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




module.exports = router;
