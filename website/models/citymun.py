from . import db

class CityMun(db.Model):
    __tablename__ = 'refcitymun'
    psgcCode = db.Column(db.String(255))
    citymunDesc = db.Column(db.Text)
    regCode = db.Column(db.String(255), nullable=True)
    provCode = db.Column(db.String(255), db.ForeignKey('refprovince.provCode'), nullable=True)
    citymunCode = db.Column(db.String(255), primary_key=True, nullable=False)

    barangays = db.relationship('Barangay', back_populates='citymun', lazy=True)
    province = db.relationship('Province', back_populates='citymuns')