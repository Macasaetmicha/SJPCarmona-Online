print("Importing models...")  # Debugging line
from .. import db

from .user import User
from .record import Record
from .parent import Parent
from .priest import Priest

from .baptism import Baptism
from .confirmation import Confirmation
from .wedding import Wedding
from .death import Death

from .region import Region
from .province import Province
from .citymun import CityMun
from .barangay import Barangay

from .enums import UserRole
from .request import Request
from .schedule import Schedule
from .audit_logs import AuditLog

print("Models imported.") 
print("Models have been imported successfully.")
