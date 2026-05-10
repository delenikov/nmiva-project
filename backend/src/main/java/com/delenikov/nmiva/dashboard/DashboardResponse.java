package com.delenikov.nmiva.dashboard;

import com.delenikov.nmiva.entry.ReminderResponse;
import java.math.BigDecimal;
import java.util.List;

public record DashboardResponse(
    VehicleSummary vehicle,
    BigDecimal totalSpentThisMonth,
    BigDecimal totalSpentAllTime,
    OdometerSnapshot latestOdometerEntry,
    BigDecimal latestFuelConsumptionLPer100Km,
    BigDecimal averageFuelConsumptionLPer100Km,
    List<ReminderResponse> upcomingReminders,
    List<ReminderResponse> overdueReminders
) {}
