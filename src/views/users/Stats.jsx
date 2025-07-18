import React, { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Skeleton } from "primereact/skeleton";
import { Dropdown } from "primereact/dropdown";

const MONTHS = {
  "01": "Январь",
  "02": "Февраль",
  "03": "Март",
  "04": "Апрель",
  "05": "Май",
  "06": "Июнь",
  "07": "Июль",
  "08": "Август",
  "09": "Сентябрь",
  10: "Октябрь",
  11: "Ноябрь",
  12: "Декабрь",
};

export default function UserStats() {
  const [table, setTable] = React.useState({
    isLoaded: false,
    rows: [],
    months: [],
  });
  const [users, setUsers] = React.useState({
    isLoaded: false,
    selected: null,
    arr: [],
  });
  const [selectedMonth, setSelectedMonth] = React.useState(null);
  const navigate = useNavigate();

  const changeUser = (id) => {
    window.location.replace(
      window.location.href.replace(/id=[0-9]+/g, `id=${id}`)
    );
    window.location.reload();
  };

  const loadData = async () => {
    setTable({ ...table, isLoaded: false });
    setUsers({ ...users, isLoaded: false });

    users.selected = window.location.href.match(/id=[0-9]+/g)[0].substring(3);

    const sessionData = JSON.parse(localStorage.getItem("session_data"));
    const response = await window.electronAPI.getRequest(
      "https://status-journal.com/user/statistics" +
        `?${new URLSearchParams(
          selectedMonth
            ? { date: selectedMonth, user: users.selected }
            : { user: window.location.href.match(/id=[0-9]+/g)[0].substring(3) }
        ).toString()}`,
      {
        headers: {
          "Accept-Language": "ru-RU,ru;q=0.9",
          "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
          "User-Agent":
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/113.0.0.0 Safari/537.36",
          Cookie: `id=${sessionData.id}; usid=${sessionData.usid}`,
        },
      }
    );

    const parser = new DOMParser();
    const parsedDocument = parser.parseFromString(response.data, "text/html");

    const tableElement = parsedDocument.querySelector("table.calendar");
    if (!tableElement) return navigate("/logout");

    users.arr = [];
    const userSelections = parsedDocument
      .querySelector(".select-user")
      .querySelectorAll("option");
    for (const i in Array.from(userSelections.keys())) {
      const user = userSelections[i];
      if (user.value == "0") continue;

      users.arr.push({
        label: user.innerText,
        value: user.value,
      });
    }

    table.rows = [];
    const tableRows = tableElement.querySelectorAll("tr");
    for (const i in Array.from(tableRows.keys())) {
      if (i == 0) continue;
      const tableRow = tableRows[i];
      let row = [];

      const tableColumns = tableRow.querySelectorAll("td");
      for (const j in Array.from(tableColumns.keys())) {
        const tableColumn = tableColumns[j];

        row.push({
          status: tableColumn.querySelector(".status-err")
            ? "error"
            : tableColumn.querySelector(".status-text")
            ? "normal"
            : tableColumn.querySelector(".status-success")
            ? "success"
            : tableColumn.querySelector(".day-status")
            ? "inactive"
            : undefined,
          day: tableColumn.querySelector(".day-number")?.innerText,
          time: tableColumn.querySelector(".day-status")?.innerText,
        });
      }

      table.rows.push(row);
    }

    table.months = [];
    const monthOptions = parsedDocument
      .querySelector(".page-title-month")
      .querySelector(".select-user")
      .querySelectorAll("option");
    for (const i in Array.from(monthOptions.keys())) {
      const option = monthOptions[i];
      if (!option.value) continue;

      const month = option.value.split(",");

      table.months.push({
        title: `${MONTHS[month[0]]} ${month[1]} года`,
        value: option.value,
      });
    }

    setUsers({ ...users, isLoaded: true });
    setTable({ ...table, isLoaded: true });
  };

  useEffect(() => {
    loadData();
  }, [selectedMonth]);

  return (
    <>
      <div className="p-4 surface-card border-round-xl shadow-3 mt-2 overflow-x-auto">
        <h3>
          Онлайн за{" "}
          {selectedMonth
            ? `${selectedMonth.replace(",", ".")}`
            : "текущий месяц"}
        </h3>

        <div className="flex gap-2">
          <Dropdown
            value={users.selected}
            onChange={(e) => changeUser(e.value)}
            options={users.arr}
            placeholder="Выберите пользователя"
            className="w-16rem mb-3"
            filter
          />
          <Dropdown
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.value)}
            options={table.months}
            optionLabel="title"
            optionValue="value"
            showClear
            placeholder="Выберите месяц"
            className="w-16rem mb-3"
          />
        </div>

        {!table.isLoaded && (
          <Skeleton height="400px" width="100%" borderRadius=".375rem" />
        )}
        {table.isLoaded && (
          <table className="shadow-2 p-2 border-round-xl surface-ground">
            <tbody>
              <tr>
                <td className="py-2 px-3 font-bold text-center">Понедельник</td>
                <td className="py-2 px-3 font-bold text-center">Вторник</td>
                <td className="py-2 px-3 font-bold text-center">Среда</td>
                <td className="py-2 px-3 font-bold text-center">Четверг</td>
                <td className="py-2 px-3 font-bold text-center">Пятница</td>
                <td className="py-2 px-3 font-bold text-center">Суббота</td>
                <td className="py-2 px-3 font-bold text-center">Воскресенье</td>
                <td className="py-2 px-3 font-bold text-center">Недельный</td>
              </tr>
              {table.rows.map((row) => (
                <tr>
                  {row.map((column) => (
                    <td
                      style={{ minWidth: "130px" }}
                      className={`relative pt-4 pb-2 px-2`}
                    >
                      {column.day && (
                        <span
                          style={{ width: "30px", height: "30px" }}
                          className="absolute text-sm flex align-items-center justify-content-center top-0 right-0 border-circle p-2 font-bold surface-hover"
                        >
                          {column.day}
                        </span>
                      )}
                      {column.time && (
                        <span
                          className={`w-12 flex align-items-center select-all justify-content-center flex-nowrap text-0 font-bold py-2 px-3 ${
                            column.status
                              ? `bg-${
                                  column.status === "error"
                                    ? "red"
                                    : column.status === "success"
                                    ? "green"
                                    : column.status === "normal"
                                    ? "indigo"
                                    : "gray"
                                }-400 border-round-md`
                              : ""
                          }`}
                        >
                          {column.time}
                        </span>
                      )}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
