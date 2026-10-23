import datetime
from sqlalchemy import Column, String, Integer, DateTime, Text, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from backend.app.database.session import Base

class Report(Base):
    __tablename__ = "reports"

    id = Column(String(64), primary_key=True, index=True)
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    crop = Column(String(32), default="tomato", nullable=False)
    lot_class = Column(String(32), nullable=False)
    n_fruit = Column(Integer, default=0, nullable=False)
    result_json = Column(Text, nullable=False)
    sha256 = Column(String(64), nullable=False, index=True)
    standards_version = Column(String(32), nullable=False)
    image_refs = Column(Text, nullable=False, default="[]")

    acknowledgements = relationship(
        "Acknowledgement",
        back_populates="report",
        cascade="all, delete-orphan",
        order_by="Acknowledgement.created_at.asc()"
    )

class Acknowledgement(Base):
    __tablename__ = "acknowledgements"

    id = Column(Integer, primary_key=True, index=True, autoincrement=True)
    report_id = Column(String(64), ForeignKey("reports.id", ondelete="CASCADE"), nullable=False, index=True)
    party = Column(String(16), nullable=False)  # 'farmer' or 'buyer'
    verdict = Column(String(16), nullable=False)  # 'accept' or 'dispute'
    note = Column(Text, nullable=True, default="")
    created_at = Column(DateTime, default=datetime.datetime.utcnow, nullable=False)
    prev_hash = Column(String(64), nullable=False)
    ack_hash = Column(String(64), nullable=False)

    report = relationship("Report", back_populates="acknowledgements")

    __table_args__ = (
        UniqueConstraint("report_id", "party", name="uq_report_party_ack"),
    )
