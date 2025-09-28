# from sqlalchemy.orm import Session
# from models import Player

# def get_players(db: Session):
#     return db.query(Player).all()

# def get_player(db: Session, player_id: int):
#     return db.query(Player).filter(Player.id == player_id).first()

# def create_player(db: Session, player_data):
#     db_player = Player(**player_data.dict())
#     db.add(db_player)
#     db.commit()
#     db.refresh(db_player)
#     return db_player

# def update_player(db: Session, player_id: int, player_data):
#     db_player = db.query(Player).filter(Player.id == player_id).first()
#     for key, value in player_data.dict().items():
#         setattr(db_player, key, value)
#     db.commit()
#     return db_player

# def delete_player(db: Session, player_id: int):
#     db_player = db.query(Player).filter(Player.id == player_id).first()
#     db.delete(db_player)
#     db.commit()