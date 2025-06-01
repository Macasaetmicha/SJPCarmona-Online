import enum

class UserRole(enum.Enum):
    ADMIN = "admin"
    STAFF = "staff"
    CLIENT = "client"

class CivilStatus(enum.Enum):
    SINGLE = "single"
    MARRIED = "married"
    WIDOWED = "widowed"
    SEPARATED = "separated"

class Ligitivity(enum.Enum):
    CIVIL = "civil"
    CATHOLIC = "catholic"

class ParentRole(enum.Enum):
    MOTHER = "mother"
    FATHER = "father"

class PriestStatus(enum.Enum):
    active = "active"
    inactive = "inactive"

class PriestPosition(enum.Enum):
    parish_priest = "parish_priest"
    guest_priest = "guest_priest"
    bishop = "bishop"

    def label(self):
        labels = {
            'parish_priest': 'Parish Priest',
            'guest_priest': 'Guest Priest',
            'bishop' : 'Bishop'
        }
        return labels[self.value]

    @property
    def label(self):
        labels = {
            "parish_priest": "Parish Priest",
            "guest_priest": "Guest Priest",
            "bishop": "Bishop"
        }
        return labels[self.value]

class Ceremonies(enum.Enum):
    baptism = "baptism"
    confirmation = "confirmation"
    wedding = "wedding"
    death = "death"

class RequestStatus(enum.Enum):
    pending = "pending"
    rejected = "rejected"
    processing = "processing"
    ready = "ready"
    completed = "completed"
    cancelled = "cancelled"

class SchedType(enum.Enum):
    parish = "parish"
    request = "request"
    holiday = "holiday"

class SchedStatus(enum.Enum):
    active = "active"
    cancelled = "cancelled"
    postponed = "postponed"
    holiday = "holiday"
