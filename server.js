//import
var express=require('express');
var app=express();
var bodyParser =require('body-parser');
var _ =require('underscore');
var db=require('./db.js');

//set the port number
var PORT=process.env.PORT || 3000;

//for the volatile data storage
var todos=[];

//id increment
var next_id=1;

//use the bodyparser 
app.use(bodyParser.json());

//Method : post
//create the new todo 
app.post('/createtodos',function(req,res)
{
	//Pick data which are needed avoid the extra data
	var body=_.pick(req.body,'description','completed');

	//trim data avoid spaces
	body.description=body.description.trim();
	
	//check data 
	//complete -  should be boolean
	//description - should be string
	//length should be greater than 0
	if( !_.isBoolean(body.completed) || !_.isString(body.description) || body.description.trim().length===0)
	{
		//show the error message
		return res.status(400).json({"error":"Something went wrong"});
	}	
	
	//push the data into database
	db.todo.create(
	{
		description:body.description,
		completed:body.completed
	}).then(function(todo)
	{
		console.log('Todo created !!!');
		console.log(todo.toJSON());		
		res.json(todo);	
	}).catch(function(e)
	{
		console.log(e);
		return res.status(400).json({"error":"Something went wrong"});		
	});

	//push the data into voliatile storage that is object
	//body.id=next_id;
	//next_id++;	
	//todos.push(body);
	//res.json(body);	
});








//delete by id
app.delete('/delete_todo_by_id/:id',function(req,res)
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

});	

//update the todo
app.put('/update_todo_by_id/:id',function(req,res)
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


	//for database

});







//get all todos
app.get('/todos',function(req,res)
{
	//send all data form object
	//res.json(todos);

	var res_todos=[];
	//get all data from database
	db.todo.findAll({}).then(function(todo)
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

//get individual todos/:id
app.get('/todos_by_id/:id',function(req,res)
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
			id:todo_id			
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

//search in the description
app.get('/todos_search_description',function(req,res)
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
				}
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
app.get('/todos_by_status',function(req,res)
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
				completed:true			
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
				completed:false			
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
	force:true
}).then(function()
{
	app.listen(PORT,function()
	{
		console.log("Express listen on port started on port "+PORT+" !! ");
	});

})
