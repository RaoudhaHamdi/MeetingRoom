'use strict';
const app = require('../server')
module.exports = function () {
  const Profil = app.models.Profil,
    Role = app.models.Role,
    RoleMapping = app.models.RoleMapping;

  Role.findOrCreate({
    where: {
      name: 'superadmin'
    }
  }, {
    name: 'superadmin'
  });
  Role.findOrCreate({
    where: {
      name: 'user'
    }
  }, {
    name: 'user'
  });

  // creation super admin
  Profil.findOrCreate({
      where: {
        email: 'superadmin@gmail.com'
      }
    }, {
      username: 'superadmin',
      email: 'superadmin@gmail.com',
      password: '2019',
      role: 'superadmin'
    },
    function (err, user) {
      if (err) return err;
      //Creation de role superadmin
      Role.findOrCreate({
        where: {
          name: 'superadmin'
        }
      }, {
        name: 'superadmin'
      }, function (err, role) {
        if (err) return err;
        // Associer le role  
        RoleMapping.find({
            filter: {
              where: {
                roleId: role.id,
                principalId: user.id
              }
            }
          },
          function (err, principals) {
            if (err) {
              return console.error(err);
            }
            if (principals.length == 0) {
              role.principals.create({
                principalType: RoleMapping.USER,
                principalId: user.id
              }, function (err, principal) {
                if (err) return err;
              });
            }
          }
        );
      });
    });


}
