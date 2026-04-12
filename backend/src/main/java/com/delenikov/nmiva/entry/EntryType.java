package com.delenikov.nmiva.entry;

public enum EntryType {
  REFUEL,
  SERVICE,
  EXPENSE,
  REMINDER;

  public static EntryType from(String value) {
    return EntryType.valueOf(value.toUpperCase());
  }
}
