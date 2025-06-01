from . import db

class Province(db.Model):
    __tablename__ = 'refprovince'
    psgcCode = db.Column(db.String(255))
    provDesc = db.Column(db.Text)
    regCode = db.Column(db.String(255), db.ForeignKey('refregion.regCode'), nullable=True)
    provCode = db.Column(db.String(255), primary_key=True, nullable=False)
    
    citymuns = db.relationship('CityMun', back_populates='province', lazy=True)
    region = db.relationship('Region', back_populates='provinces')