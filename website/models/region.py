from . import db

class Region(db.Model):
    __tablename__ = 'refregion'
    psgcCode = db.Column(db.String(255))
    regDesc = db.Column(db.Text)
    regCode = db.Column(db.String(255), primary_key=True, nullable=False)

    provinces = db.relationship('Province', back_populates='region', lazy=True)


