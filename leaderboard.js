PlayersList = new Mongo.Collection("players");

if(Meteor.isClient){
	Template.leaderboard.helpers({
		"player": function(){
			var currentUserId = Meteor.userId();
			return PlayersList.find({ createdBy: currentUserId}, 
									{ sort: { score: -1, name: 1 } });
		},
		"selectedClass": function(){
			var playerId = this._id;
			var selectedPlayer = Session.get("selectedPlayer");
			if(playerId == selectedPlayer) {
				return "selected";
			}
		},
		"selectedPlayer": function(){
			var selectedPlayer = Session.get("selectedPlayer");
			return PlayersList.findOne({ _id: selectedPlayer });
		},
		"count": function(){
			return PlayersList.find().count();
		}
	});
	Template.leaderboard.events({
		"click .player": function(){
			var playerId = this._id;
			Session.set("selectedPlayer", playerId);			
		},
		"click .increment": function(){
			var selectedPlayer = Session.get("selectedPlayer");
			Meteor.call("updateScore", selectedPlayer, 5);
		},
		"click .decrement": function(){
			var selectedPlayer = Session.get("selectedPlayer");
			Meteor.call("updateScore", selectedPlayer, -5);
		},
		"click .remove": function(){
			var selectedPlayer = Session.get("selectedPlayer");			
			var remPlayer = confirm("Do you really want to remove the player?");
			if(remPlayer)
				Meteor.call("removePlayer", selectedPlayer);
		}
	});
	Template.addPlayerForm.events({
		"submit form": function(event){
			event.preventDefault();
			var playerNameVar = event.target.playerName.value;
			var playerScoreVar = parseInt(event.target.playerScore.value);			
			if(!playerScoreVar || playerScoreVar < 0)				
				var playerScoreVar = 0;			
			Meteor.call("createPlayer", playerNameVar, playerScoreVar);
			event.target.playerName.value = "";
			event.target.playerScore.value = "";
		}
	});

	Meteor.subscribe("thePlayers");
}

if (Meteor.isServer) {
	Meteor.publish("thePlayers", function(){
		var currentUserId = this.userId;
		return PlayersList.find({ createdBy: currentUserId });
	});
}

Meteor.methods({
	"createPlayer": function(playerNameVar, playerScoreVar){
		check(playerNameVar, String);
		check(playerScoreVar, Number);
		var currentUserId = Meteor.userId();
		if(currentUserId && (playerNameVar != "" && !isNaN(playerScoreVar))){
			PlayersList.insert({
				name: playerNameVar,
				score: playerScoreVar,
				createdBy: currentUserId
			});
		}
	},
	"removePlayer": function(selectedPlayer){
		check(selectedPlayer, String);
		var currentUserId = Meteor.userId();
		if(currentUserId)
			PlayersList.remove({ _id: selectedPlayer, createdBy: currentUserId });
	},
	"updateScore": function(selectedPlayer, scoreValue){
		check(selectedPlayer, String);
		check(scoreValue, Number);
		var currentUserId = Meteor.userId();
		var playerScore = PlayersList.findOne({ _id: selectedPlayer }).score;
		if (scoreValue == -5 && playerScore <= 0) {	
			// do nothing		
		} else if (currentUserId && (scoreValue == 5 || scoreValue == -5)) {
			PlayersList.update({ _id: selectedPlayer, createdBy: currentUserId },
							{ $inc: { score: scoreValue }});
		}
	}
});