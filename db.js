var Sequelize =require('sequelize');
var env=process.env.NODE_ENV || 'development';

var seq_obj;

if(env==='production')
{
	//console.log("Database URL : "+process.env.DATABASE_URL);
	seq_obj=new Sequelize(process.env.DATABASE_URL,{
	dialect:'postgres',	
	});
}
else
{
	seq_obj=new Sequelize(undefined,undefined,undefined,{
	'dialect':'sqlite',
	'storage':__dirname+'/data/database-todo.sqlite'
	});
}

var db={};

db.todo=seq_obj.import(__dirname+'/models/todo.js');
db.seq_obj=seq_obj;
db.Sequelize=Sequelize;
db.seq_obj.sync(
{
	force:true
}).then(function()
{
	console.log("database created");
});
module.exports=db;
