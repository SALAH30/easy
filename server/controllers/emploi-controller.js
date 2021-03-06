module.exports = function(Spec, Seance, Teacher, Salle){

  function addSeance(groupeId, sectionId, day, seanceSave, callback){
    let seance = new Seance(seanceSave);
    seance.save((err, seance) => {
      Salle.findOne({_id : seanceSave.salle}, (err, s) => {
          s.emploi[day].push(seance._id);
          s.save();
      });
      Teacher.findOne({_id : seanceSave.teacher}, (err, t) => {
          t.emploi[day].push(seance._id);
          if(t.modules.indexOf(seanceSave.module) == -1) {
            t.modules.push(seanceSave.module);
          }
          if(t.groupes.indexOf(groupeId) == -1) {
            t.groupes.push(groupeId);
          }
          t.save();
      });
      Spec.findOne({'sections._id': sectionId, 'sections.groupes._id': groupeId},
        (err, spec) => {
          let groupe = spec.sections.id(sectionId).groupes.id(groupeId);
          groupe.emploi[day].push(seance._id);
          spec.save((err, spec) => {
            seance.populate('teacher salle module', (err, seance) => {
              callback(err, seance);
            });
          });
        });
    });
  }


  function deleteSeance(sectionId, groupeId, seanceId, teacherId, salleId, day, callback){
     Spec.findOne({'sections._id': sectionId, 'sections.groupes._id': groupeId},
       (err, spec) => {
         let groupe = spec.sections.id(sectionId).groupes.id(groupeId);
         groupe.emploi[day].pull(seanceId);
         spec.save();
       });
    Teacher.findOne({_id: teacherId}, (err, teacher) => {
        teacher.emploi[day].pull(seanceId);
        teacher.save();
    });
    Salle.findOne({_id: salleId }, (err, salle) => {
        salle.emploi[day].pull(seanceId);
        salle.save();
        callback(err, {message :true});
    });
    Seance.findOne({_id: seanceId}).remove().exec();
  }

  function getTimeTable(sectionId, groupeId , callback){
    Spec.findOne({'sections._id':sectionId, 'sections.groupes._id' : groupeId},'sections')
      .populate('sections.groupes.emploi.sunday \
                sections.groupes.emploi.monday\
                sections.groupes.emploi.tuesday\
                sections.groupes.emploi.wednesday\
                sections.groupes.emploi.thursday').exec((err, spec) => {
        let emploi = spec.sections.id(sectionId).groupes.id(groupeId).emploi;
        callback(err, emploi);
      });
  }

  function getTimeTableByGroupe(groupeId , callback){
    Spec.findOne({'sections.groupes._id' : groupeId},'sections')
      .populate('sections.groupes.emploi.sunday \
                sections.groupes.emploi.monday\
                sections.groupes.emploi.tuesday\
                sections.groupes.emploi.wednesday\
                sections.groupes.emploi.thursday').exec((err, spec) => {
       // let emploi = spec.sections.groupes.id(groupeId).emploi;
        callback(err, spec);
      });
  }

  function getSalleEmploie(salleId, callback){
    Salle.findOne({ _id : salleId}).populate('emploi.sunday emploi.monday emploi.tuesday emploi.wednesday emploi.thursday').exec( (err, seance) => {
            callback(err,seance);
    });
  }

  function getTeacherEmploie(teacherId, callback){
    Teacher.findOne({ _id : teacherId}).populate('emploi.sunday emploi.monday emploi.tuesday emploi.wednesday emploi.thursday').exec( (err, teacher) => {
            callback(err, teacher.emploi);
    });
  }


    return {
      addSeance,
      deleteSeance,
      getTimeTable,
      getTimeTableByGroupe,
      getTeacherEmploie,
      getSalleEmploie
    };
}
