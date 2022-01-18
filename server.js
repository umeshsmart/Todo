//import
var express=require('express');
var app=express();
var bodyParser =require('body-parser');
var _ =require('underscore');
var db=require('./db.js');
var bcrypt=require('bcrypt');
var middleware=require('./middleware.js')(db);
//set the port number
var PORT=process.env.PORT || 3000;

//for the volatile data storage
//var todos=[];

//id increment
var next_id=1;

//use the bodyparser 
app.use(bodyParser.json());


//login 
app.post('/user/login',function(req,res)
{
	//Pick data which are needed avoid the extra data
	var body=_.pick(req.body,'email','password');

	var userInstance;

	db.user.authenticate(body).then(function(user)
	{
		var token=user.generateToken('authentication');
		userInstance=user;
		return db.token.create({
			token:token
		});

		// if(token)
		// {
		// 	res.header('Auth',token).json(user.toPublicJSON());	
		// }
		// else
		// {
		// 	res.status(401).send();		
		// }		
	}).then(function(token)
	{
		res.header('Auth',token.get('token')).json(userInstance.toPublicJSON());	
	}).catch(function()
	{
		res.status(401).send();
	});	
});

//delete for logout
app.delete('/user/logout',middleware.requireAuthentication,function(req,res)
{
	req.token.destroy().then(function()
	{
		res.status(204).send();

	}).catch(function()
	{
		res.status(500).send();
	})
});

//create the new user
app.post('/createuser',function(req,res)
{
	//Pick data which are needed avoid the extra data
	var body=_.pick(req.body,'email','password');

	//trim data avoid spaces
	body.email=body.email.trim();
	body.password=body.password.trim();

	//push the data into database
	db.user.create(
	{
		email:body.email,
		password:body.password
	}).then(function(user)
	{
		console.log('user created !!!');
		console.log(user.toJSON());		
		console.log(user.toPublicJSON());		
		res.json(user.toPublicJSON());	
	}).catch(function(e)
	{
		console.log(e);
		return res.status(400).json(e);		
	});
});


//Method : post
//create the new todo 
app.post('/createtodos',middleware.requireAuthentication,function(req,res)
{
	//Pick data which are needed avoid the extra data
	var body=_.pick(req.body,'description','completed');

	//trim data avoid spaces
	body.description=body.description.trim();
	
	
	//push the data into database
	db.todo.create(
	{
		description:body.description,
		completed:body.completed
	}).then(function(todo)
	{
		console.log('Todo created !!!');
		console.log(todo.toJSON());		
		//res.json(todo);
		req.user.addTodo(todo).then(function()
		{
			return todo.reload();
		}).then(function(todo)
		{
			res.json(todo);
		});	
	}).catch(function(e)
	{
		console.log(e);
		return res.status(400).json(e);		
	});

	//push the data into voliatile storage that is object
	//check data 
	//complete -  should be boolean
	//description - should be string
	//length should be greater than 0
	// if( !_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length===0)
	// {
	// 	//show the error message
	// 	return res.status(400).json({"error":"Something went wrong"});
	// }	
	//body.id=next_id;
	//next_id++;	
	//todos.push(body);
	//res.json(body);	
});








//delete by id
app.delete('/delete_todo_by_id/:id',middleware.requireAuthentication,function(req,res)
{
	var todo_id=parseInt(req.params.id);
	
	//static
	//using underscore library
	/*var matchedtodo=_.findWhere(todos,{id:todo_id})
	if(matchedtodo)
	{
		todos=_.without(todos,matchedtodo);
		res.json(todos);	
	}
	else
	{
		res.status(400).json({"error":"no todo found with that id"});
	}
	*/

	//for database
	db.todo.destroy(
	{
		where:
		{
			id:todo_id,
			userId:req.user.get('id')
		}
	}).then(function(row_deleted)
	{
		if(row_deleted===0)
		{
			res.status(404).json({"error":"No todo with id "+todo_id});		
		}
		else
		{
			console.log("Todo deleted of id  "+todo_id+"!!!! ");
			res.status(200).json({"Status":"Row deleted"});
		}
	},function()
	{
		res.status(500).json({"error":"server error"});
	});
});	

//delete user by id
app.delete('/delete_user_by_id/:id',function(req,res)
{
	var user_id=parseInt(req.params.id);
	
	//for database
	db.user.destroy(
	{
		where:
		{
			id:user_id
		}
	}).then(function(row_deleted)
	{
		if(row_deleted===0)
		{
			res.status(404).json({"error":"No user with id "+user_id});		
		}
		else
		{
			console.log("user deleted of id  "+user_id+"!!!! ");
			res.status(200).json({"Status":"Row deleted"});
		}
	},function()
	{
		res.status(500).json({"error":"server error"});
	});
});	


//update the todo
app.put('/update_todo_by_id/:id',middleware.requireAuthentication,function(req,res)
{
	var todo_id=parseInt(req.params.id);
	
	//for static
	//using underscore library
	/*var matchedtodo=_.findWhere(todos,{id:todo_id})	
	if(matchedtodo)
	{
		//pick two column only data validation
		var body=_.pick(req.body,'description','completed');
		var validateattribute={};
		
		if(body.hasOwnProperty('completed')  && _.isBoolean(body.completed))
		{						
			validateattribute.completed=body.completed;
		}
		else if(body.hasOwnProperty('completed'))
		{
			return res.status(400).json({"error":"The complete type is not boolean"});
		}


		if(body.hasOwnProperty('description')  && _.isString(body.description) && body.description.trim().length>0)
		{
			validateattribute.description=body.description;
		}
		else if(nodebody.hasOwnProperty('description'))
		{
			return res.status(400).json({"error":"The description type is not string"});
		}
		else if(body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length===0)
		{
			return res.status(400).json({"error":"The description string is empty"});	
		}

		matchedtodo=_.extend(matchedtodo,validateattribute);	
		return 	res.json(matchedtodo);	
	
	}
	else
	{
		res.status(400).json({"error":"no todo found with that id"});
	}
	*/


	//from database
	//pick two column only data validation
	var body=_.pick(req.body,'description','completed');
	var validateattribute={};
				
	if(body.hasOwnProperty('completed')  && _.isBoolean(body.completed))
	{						
		validateattribute.completed=body.completed;
	}
	else if(body.hasOwnProperty('completed'))
	{
		return res.status(400).json({"error":"The complete type is not boolean"});
	}


	if(body.hasOwnProperty('description')  && _.isString(body.description) && body.description.trim().length>0)
	{
		validateattribute.description=body.description;
	}
	else if(body.hasOwnProperty('description'))
	{
		return res.status(400).json({"error":"The description type is not string"});
	}
	else if(body.hasOwnProperty('description') && _.isString(body.description) && body.description.trim().length===0)
	{
		return res.status(400).json({"error":"The description string is empty"});	
	}
	
	db.todo.findOne(
		{
			where:
			{
				id:todo_id,
				userId:req.user.get('id')
			}
		}).then(function(todo)
	{
		console.log('Display todo by id '+todo_id+'!!');
		if(todo)
		{
			todo.update(validateattribute).then(function(todo)
			{
				console.log("Todo updated !!!! ");
				console.log(todo.toJSON());
				res.json(todo.toJSON());
			}).catch(function(e)
			{
				console.log(e);
				res.status(500).json({"error":"Server error"});
			});			
		}
		else
		{
			res.status(404).json({"error":"No todos with this id "+todo_id});
		}			
	},function(){
		res.status(500).send();
	})
	
});

//update the user
app.put('/update_user_by_id/:id',function(req,res)
{
	var user_id=parseInt(req.params.id);
	//from database
	//pick two column only data validation
	var body=_.pick(req.body,'email','password');
	var validateattribute={};
				
	if(body.hasOwnProperty('email')   && _.isString(body.email))
	{						
		validateattribute.email=body.email;
	}
	else if(body.hasOwnProperty('email'))
	{
		return res.status(400).json({"error":"The email type is not string"});
	}


	if(body.hasOwnProperty('password')  && _.isString(body.password) && body.password.trim().length>7)
	{
		validateattribute.password=body.password;
	}
	else if(body.hasOwnProperty('password') && _.isString(body.password) && body.password.trim().length<8)
	{
		return res.status(400).json({"error":"The password string len is less than 8"});	
	}
	else if(body.hasOwnProperty('password'))
	{
		return res.status(400).json({"error":"The password type is not string"});
	}
	

	db.user.findById(user_id).then(function(user)
	{
		console.log('Display user by id '+user_id+'!!');
		if(user)
		{
			user.update(validateattribute).then(function(user)
			{
				console.log("User updated !!!! ");
				console.log(user.toJSON());
				res.json(user.toJSON());
			}).catch(function(e)
			{
				console.log(e);
				res.status(500).json({"error":"Server error"});
			});			
		}
		else
		{
			res.status(404).json({"error":"No user with this id "+user_id});
		}			
	},function(){
		res.status(500).send();
	})
	
});






//get all todos
app.get('/todos',middleware.requireAuthentication,function(req,res)
{
	//send all data form object
	//res.json(todos);

	var res_todos=[];
	//get all data from database
	db.todo.findAll(
		{
			where:
			{
				userId:req.user.get('id')
			}
		}).then(function(todo)
	{
		console.log('Display all todos');
		if(todo.length>0)
		{		
			todo.forEach(function(todo)
			{
				console.log(todo.toJSON());				
				res_todos.push(todo);
			})
			res.json(res_todos);					
		}
		else
		{
			res.status(404).json({"error":"No todos"});
		}
	}).catch(function(e)
	{
		console.log(e);
		res.status(500).json({"error":"Server error"});
	});
});


//get all user
app.get('/users',function(req,res)
{
	var res_user=[];
	//get all data from database
	db.user.findAll({}).then(function(user)
	{
		console.log('Display all user');
		if(user.length>0)
		{		
			user.forEach(function(user)
			{
				console.log(user.toJSON());				
				res_user.push(user);
			})
			res.json(res_user);					
		}
		else
		{
			res.status(404).json({"error":"No user"});
		}
	}).catch(function(e)
	{
		console.log(e);
		res.status(500).json({"error":"Server error"});
	});
});

//get individual todos/:id
app.get('/todos_by_id/:id',middleware.requireAuthentication,function(req,res)
{
	var todo_id=parseInt(req.params.id);
	var matchedtodo=[];
	
	//using underscore library
	//from local object
	//var matchedtodo=_.findWhere(todos,{id:todo_id})
	
	//from database
	db.todo.findAll
	({
		where:
		{
			id:todo_id,
			userId:req.user.get('id')
		}
	}).then(function(todo)
	{
		console.log('Display todo by id '+todo_id+'!!');
		if(todo.length>0)
		{
			todo.forEach(function(todo)
			{
				console.log(todo.toJSON());				
				matchedtodo.push(todo);
			})	
			res.json(matchedtodo);
		}
		else
		{
			res.status(404).json({"error":"No todos with this id "+todo_id});
		}			
	}).catch(function(e)
	{
		console.log(e);
		res.status(500).json({"error":"Server error"});
	});	
	

	//By own code
	/*
	//console.log(todo_id);
	var len=todos.length;
	var flag=true;
	for(var i=0;i<len;i++)
	{
		if(todos[i].id === todo_id)
		{
			
			matchedtodo.push(todos[i]);			
		}
	}
	if(matchedtodo.length===0)
	{				
		res.status(404).json({"error":"So todos with this id"});
	}
	else
	{
		res.send(matchedtodo);
	}
	*/
});
//get individual user/:id
app.get('/user_by_id/:id',function(req,res)
{
	var user_id=parseInt(req.params.id);
	var matcheduser=[];
	
	//using underscore library
	//from local object
	//var matchedtodo=_.findWhere(todos,{id:todo_id})
	
	//from database
	db.user.findAll
	({
		where:
		{
			id:user_id			
		}
	}).then(function(user)
	{
		console.log('Display user by id '+user_id+'!!');
		if(user.length>0)
		{
			user.forEach(function(user)
			{
				console.log(user.toJSON());				
				matcheduser.push(user);
			})	
			res.json(matcheduser);
		}
		else
		{
			res.status(404).json({"error":"No user with this id "+user_id});
		}			
	}).catch(function(e)
	{
		console.log(e);
		res.status(500).json({"error":"Server error"});
	});	
});


//search in the description
app.get('/todos_search_description',middleware.requireAuthentication,function(req,res)
{

	var query_params=req.query;
	var search_todos=[];

	if(query_params.hasOwnProperty('description')  && _.isString(query_params.description) && query_params.description.length>0)
	{
		//static object
		/*search_todos=_.filter(todos,function(todo)
			{
				return todo.description.indexOf(query_params.description)>-1;
			});		
		if(search_todos)
		{
			res.json(search_todos);
		}
		else
		{
			res.status(404).json({"error":"No such data "});s		
		}
		*/

		//with database
		db.todo.findAll
		({
			where:
			{
				description:
				{
					$like:'%'+query_params.description+'%' //searching
				},
				userId:req.user.get('id')
			}
		}).then(function(todo)
		{
			console.log('Display todo with description '+query_params.description);
			if(todo.length>0)
			{
				todo.forEach(function(todo)
				{
					console.log(todo.toJSON());				
					search_todos.push(todo);
				})	
				res.json(search_todos);
			}
			else
			{
				res.status(404).json({"error":"No todos with description "+query_params.description});
			}			
		}).catch(function(e)
		{
			console.log(e);
			res.status(500).json({"error":"Server error"});
		});	
	}
	else if(query_params.hasOwnProperty('description')  && _.isString(query_params.description) && query_params.description.length===0)
	{
		res.status(404).json({"error":"The string is empty"});
	}

});



//get completed todos
app.get('/todos_by_status',middleware.requireAuthentication,function(req,res)
{
	var query_params=req.query;	

	if(query_params.hasOwnProperty('completed') && query_params.completed==='true')
	{
		//static
		//filtered_todos=_.where(todos,{completed:true});

		var matchedtodo=[];

		//from database
		db.todo.findAll
		({
			where:
			{
				completed:true,
				userId:req.user.get('id')		
			}
		}).then(function(todo)
		{
			console.log('Display todo with completed true!!');
			if(todo.length>0)
			{
				todo.forEach(function(todo)
				{
					console.log(todo.toJSON());				
					matchedtodo.push(todo);
				})	
				res.json(matchedtodo);
			}
			else
			{
				res.status(404).json({"error":"No todos with status completed true"});
			}			
		}).catch(function(e)
		{
			console.log(e);
			res.status(500).json({"error":"Server error"});
		});	
	}
	else if(query_params.hasOwnProperty('completed') && query_params.completed==='false')
	{
		//static
		//filtered_todos=_.where(todos,{completed:false})


		//from database
		var matchedtodo=[];
		db.todo.findAll
		({
			where:
			{
				completed:false,
				userId:req.user.get('id')
			}
		}).then(function(todo)
		{
			console.log('Display todo with completed false!!');
			if(todo.length>0)
			{
				todo.forEach(function(todo)
				{
					console.log(todo.toJSON());				
					matchedtodo.push(todo);
				})	
				res.json(matchedtodo);
			}
			else
			{
				res.status(404).json({"error":"No todos with status completed false"});
			}			
		}).catch(function(e)
		{
			console.log(e);
			res.status(500).json({"error":"Something went wrong"});

		});	
	}	
	else
	{
		res.status(404).json({"error":"Something went wrong"});
	}
});



/*
app.get('/todos_by_status/:status',function(req,res)
{
	var todo_status;
	if(req.params.status==='true')
	{
		todo_status=true;
	}
	if(req.params.status==='false')
	{
		todo_status=false;
	}
	
	var len=todos.length;
	var flag=true;
	var result=[];
	for(var i=0;i<len;i++)
	{
		if(todos[i].completed === todo_status)
		{
			
			flag=false;
			result.push(todos[i]);
			//res.send(todos[i]);
		}
	}
	if(flag===true)
	{		res.status(404).send();
	}
	else
	{
		res.json(result);
	}
	

});
*/

app.get('/',function(req,res)
{
	res.send('TODO API root');
});

db.seq_obj.sync(
{
	//force:true
}).then(function()
{
	app.listen(PORT,function()
	{
		console.log("Express listen on port started on port "+PORT+" !! ");
	});
})
