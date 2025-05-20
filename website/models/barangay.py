from . import db

class Barangay(db.Model):
    __tablename__ = 'refbrgy'
    brgyCode = db.Column(db.String(255), primary_key=True, nullable=False)
    brgyDesc = db.Column(db.Text)
    regCode = db.Column(db.String(255), nullable=True)
    provCode = db.Column(db.String(255), nullable=True)
    citymunCode = db.Column(db.String(255), db.ForeignKey('refcitymun.citymunCode'), nullable=True)

    citymun = db.relationship('CityMun', back_populates='barangays')