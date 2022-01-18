var cryptojs=require('crypto-js');
module.exports=function(seq_obj,Sequelize)
{
	return seq_obj.define('token',{
		token:
		{
			type:Sequelize.VIRTUAL,
			allowNull:false,
			validate:{
				len:[1]
			},
			set:function(value)
			{
				var hash = cryptojs.MD5(value).toString();

				this.setDataValue('token',value);
				this.setDataValue('tokenHash',hash);
			}
		},
		tokenHash:Sequelize.STRING

	});
};