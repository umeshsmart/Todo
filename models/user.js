var bcrypt=require('bcrypt');
var _=require('underscore');
module.exports=function(seq_obj,Sequelize)
{
	var user = seq_obj.define('user',{
		email:
		{
			type:Sequelize.STRING,
			allowNull:false,
			unique:true,
			//validation
			validate:
			{
				isEmail:true
			}
		},
		salt:
		{
			type:Sequelize.STRING
		},
		password_hash:
		{
			type:Sequelize.STRING
		},
		password:
		{
			type:Sequelize.STRING,
			allowNull:false,
			validate:
			{
				len:[8,16]
			},
			set:function(value)
			{
				//if both person enter same password then diff hash passsword
				var salt = bcrypt.genSaltSync(10);
				var hashed_password=bcrypt.hashSync(value,salt);
				//console.log("Hashed password:");
				//console.log(hashed_password);
				this.setDataValue('password',value);
				this.setDataValue('salt',salt);
				this.setDataValue('password_hash',hashed_password);
			}

		}
	},
	{
		hooks:
		{
			//middleware for the beforevalidate
			beforeValidate:function(user,option)
			{
				//user.email
				if(typeof user.email === 'string')
				{
					user.email=user.email.toLowerCase();
				}
			}
		},
		//show only public json not password for security
		instanceMethods:
		{
			toPublicJSON:function()
			{
				var json = this.toJSON();
				return _.pick(json,'id','email','createdAt','updatedAt');
			}
		},
		classMethods:
		{
			authenticate:function(body)
			{
				return new Promise(function(resolve,reject)
				{
					if(typeof body.email !== 'string' || typeof body.password !== 'string')
					{
						return reject();
					}
					user.findOne(
					{
						where:
						{
							email:body.email
						}
					}).then(function(user)
					{
						if(!user || !bcrypt.compareSync(body.password,user.get('password_hash')))
						{
							return reject();		
						}
						resolve(user);

					},function(e)
					{
						return reject();
					})
				});
			}
		}
	});
	return user;
}